import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { attempts } from '#lib/server/db/schema.js';
import { parseAttempt, readBody } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.student) error(401);
	const a = await readBody(request, parseAttempt);
	await db.insert(attempts).values({ studentId: locals.student.id, ...a });
	return new Response(null, { status: 204 });
};
