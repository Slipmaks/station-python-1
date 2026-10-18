import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { progress, workspaces } from '#lib/server/db/schema.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const s = locals.student;
	if (!s) redirect(303, locals.teacher ? '/teacher' : '/login');
	const [done, ws] = await Promise.all([
		db.select({ missionId: progress.missionId, stars: progress.stars }).from(progress).where(eq(progress.studentId, s.id)),
		db.select({ data: workspaces.data }).from(workspaces).where(eq(workspaces.studentId, s.id)).get()
	]);
	return {
		student: { id: s.id, name: s.name, className: s.className },
		unlockAll: s.unlockAll,
		done: Object.fromEntries(done.map(r => [r.missionId, { stars: r.stars }])),
		workspace: ws?.data ?? null
	};
};
