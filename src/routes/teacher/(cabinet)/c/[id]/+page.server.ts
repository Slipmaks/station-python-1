import { fail } from '@sveltejs/kit';
import { and, count, eq, inArray, max, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { attempts, classes, progress, students } from '#lib/server/db/schema.js';
import { STUCK_FAILS, buildReport } from '#lib/server/report.js';
import { requireClass } from '#lib/server/teacher.js';
import { LESSONS, findLesson, lessonNo } from '#lib/lessons/index.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const cls = await requireClass(locals, params.id);
	// без ?lesson — останній відкритий урок: найімовірніше, саме його клас зараз проходить
	const lesson =
		findLesson(url.searchParams.get('lesson') ?? '') ?? LESSONS.findLast(l => l.missions.length && cls.openLessons.includes(l.id)) ?? LESSONS[0];
	const ids = lesson.missions.map(m => m.id);
	const inClass = eq(students.classId, cls.id);
	const [list, done, stats] = await Promise.all([
		db.select({ id: students.id, name: students.name, lockedUntil: students.lockedUntil }).from(students).where(inClass),
		!ids.length ? [] : db
			.select({ studentId: progress.studentId, missionId: progress.missionId, stars: progress.stars })
			.from(progress)
			.innerJoin(students, eq(students.id, progress.studentId))
			.where(and(inClass, inArray(progress.missionId, ids))),
		!ids.length ? [] : db
			.select({
				studentId: attempts.studentId,
				missionId: attempts.missionId,
				attempts: count(),
				fails: sql<number>`sum(1 - ${attempts.passed})`.mapWith(Number),
				hints: max(attempts.hints),
				last: sql<number>`max(${attempts.createdAt})`.mapWith(Number)
			})
			.from(attempts)
			.innerJoin(students, eq(students.id, attempts.studentId))
			.where(and(inClass, inArray(attempts.missionId, ids)))
			.groupBy(attempts.studentId, attempts.missionId)
	]);
	const now = new Date();
	list.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
	const report = buildReport(
		ids,
		list,
		done,
		stats.map(s => ({ ...s, hints: s.hints ?? 0, last: new Date(s.last) })),
		now
	);
	return {
		cls: { id: cls.id, name: cls.name, code: cls.code, unlockAll: cls.unlockAll },
		lessons: LESSONS.map(l => ({ id: l.id, no: lessonNo(l), title: l.title, ready: l.missions.length > 0, open: cls.openLessons.includes(l.id) })),
		lesson: lesson.id,
		missions: lesson.missions.map(m => ({ id: m.id, name: m.name })),
		...report,
		now,
		stuckFails: STUCK_FAILS
	};
};

export const actions: Actions = {
	unlock: async ({ request, locals, params }) => {
		const cls = await requireClass(locals, params.id);
		const value = (await request.formData()).get('value') === '1';
		await db.update(classes).set({ unlockAll: value }).where(eq(classes.id, cls.id));
	},
	/** Відкрити чи закрити класу урок з ?lesson. */
	lesson: async ({ request, locals, params, url }) => {
		const cls = await requireClass(locals, params.id);
		const l = findLesson(url.searchParams.get('lesson') ?? '');
		if (!l?.missions.length) return fail(400);
		const rest = cls.openLessons.filter(id => id !== l.id);
		const open = (await request.formData()).get('open') === '1';
		await db.update(classes).set({ openLessons: open ? [...rest, l.id] : rest }).where(eq(classes.id, cls.id));
	}
};
