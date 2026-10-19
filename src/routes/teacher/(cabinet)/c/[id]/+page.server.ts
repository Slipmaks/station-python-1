import { count, eq, max, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { attempts, classes, progress, students } from '#lib/server/db/schema.js';
import { STUCK_FAILS, buildReport } from '#lib/server/report.js';
import { requireClass } from '#lib/server/teacher.js';
import { MISSIONS } from '#lib/lessons/index.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const cls = await requireClass(locals, params.id);
	const inClass = eq(students.classId, cls.id);
	const [list, done, stats] = await Promise.all([
		db.select({ id: students.id, name: students.name, lockedUntil: students.lockedUntil }).from(students).where(inClass),
		db
			.select({ studentId: progress.studentId, missionId: progress.missionId, stars: progress.stars })
			.from(progress)
			.innerJoin(students, eq(students.id, progress.studentId))
			.where(inClass),
		db
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
			.where(inClass)
			.groupBy(attempts.studentId, attempts.missionId)
	]);
	const now = new Date();
	list.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
	const report = buildReport(
		MISSIONS.map(m => m.id),
		list,
		done,
		stats.map(s => ({ ...s, hints: s.hints ?? 0, last: new Date(s.last) })),
		now
	);
	return {
		cls: { id: cls.id, name: cls.name, code: cls.code, unlockAll: cls.unlockAll },
		missions: MISSIONS.map(m => ({ id: m.id, name: m.name })),
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
	}
};
