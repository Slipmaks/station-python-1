import { redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { attempts, progress, sessions, students, workspaces } from '#lib/server/db/schema.js';
import { hashSecret, newPin } from '#lib/server/secrets.js';
import { requireStudent } from '#lib/server/teacher.js';
import { LESSONS, lessonNo } from '#lib/lessons/index.js';
import type { Actions, PageServerLoad } from './$types';

/** Скільки останніх спроб показувати в кожному відсіку. */
const SHOWN = 20;

export const load: PageServerLoad = async ({ locals, params }) => {
	const { cls, st } = await requireStudent(locals, params.id, params.sid);
	const [done, all] = await Promise.all([
		db.select({ missionId: progress.missionId, stars: progress.stars, completedAt: progress.completedAt }).from(progress).where(eq(progress.studentId, st.id)),
		db
			.select({ id: attempts.id, missionId: attempts.missionId, step: attempts.step, answer: attempts.answer, passed: attempts.passed, hints: attempts.hints, sol: attempts.sol, stars: attempts.stars, createdAt: attempts.createdAt })
			.from(attempts)
			.where(eq(attempts.studentId, st.id))
			.orderBy(desc(attempts.id))
	]);
	const missions = (l: (typeof LESSONS)[number]) => l.missions.map(m => {
		const list = all.filter(a => a.missionId === m.id);
		return {
			id: m.id,
			name: m.name,
			kind: m.kind,
			/** Як підписати крок спроби: номер програми в ремонтному відсіку, номер запитання у вікторині. */
			stepName: 'steps' in m ? 'програма' : m.kind === 'choice' ? 'запитання' : '',
			done: done.find(d => d.missionId === m.id) ?? null,
			total: list.length,
			fails: list.filter(a => !a.passed).length,
			hints: Math.max(0, ...list.map(a => a.hints)),
			attempts: list.slice(0, SHOWN)
		};
	});
	return {
		cls: { id: cls.id, name: cls.name },
		student: { id: st.id, name: st.name, createdAt: st.createdAt, lockedUntil: st.lockedUntil && st.lockedUntil > new Date() ? st.lockedUntil : null },
		lessons: LESSONS.filter(l => l.missions.length).map(l => ({ id: l.id, no: lessonNo(l), title: l.title, missions: missions(l) })),
		shown: SHOWN
	};
};

export const actions: Actions = {
	/** Новий PIN показуємо вчителю один раз; блокування знімаємо, усі сесії учня завершуємо. */
	resetPin: async ({ locals, params }) => {
		const { st } = await requireStudent(locals, params.id, params.sid);
		const pin = newPin();
		await db.batch([
			db.update(students).set({ pinHash: await hashSecret(pin), failedPins: 0, lockedUntil: null }).where(eq(students.id, st.id)),
			db.delete(sessions).where(eq(sessions.studentId, st.id))
		]);
		return { pin };
	},

	/** Учня й усі його дані — одним пакетом: або все, або нічого. */
	delete: async ({ locals, params }) => {
		const { cls, st } = await requireStudent(locals, params.id, params.sid);
		await db.batch([
			db.delete(attempts).where(eq(attempts.studentId, st.id)),
			db.delete(progress).where(eq(progress.studentId, st.id)),
			db.delete(workspaces).where(eq(workspaces.studentId, st.id)),
			db.delete(sessions).where(eq(sessions.studentId, st.id)),
			db.delete(students).where(eq(students.id, st.id))
		]);
		redirect(303, `/teacher/c/${cls.id}`);
	}
};
