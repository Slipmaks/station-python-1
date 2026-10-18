import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { progress } from '#lib/server/db/schema.js';
import { parseCompletion, readBody } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

/* ponytail: зірки рахує браузер і сервер їм довіряє; перевірка розв’язку на сервері — етап 4. */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.student) error(401);
	const { missionId, stars } = await readBody(request, parseCompletion);
	// зберігаємо найкращий результат і час першого проходження
	await db
		.insert(progress)
		.values({ studentId: locals.student.id, missionId, stars })
		.onConflictDoUpdate({ target: [progress.studentId, progress.missionId], set: { stars: sql`max(${progress.stars}, excluded.stars)` } });
	return new Response(null, { status: 204 });
};
