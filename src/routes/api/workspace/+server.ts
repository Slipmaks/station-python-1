import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { workspaces } from '#lib/server/db/schema.js';
import { parseWorkspace, readBody } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.student) error(401);
	const data = await readBody(request, parseWorkspace);
	const updatedAt = new Date();
	await db
		.insert(workspaces)
		.values({ studentId: locals.student.id, data, updatedAt })
		.onConflictDoUpdate({ target: workspaces.studentId, set: { data, updatedAt } });
	return new Response(null, { status: 204 });
};
