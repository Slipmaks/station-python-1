import { error } from '@sveltejs/kit';
import { and, eq, gt, isNotNull, max, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { attempts, progress } from '#lib/server/db/schema.js';
import { parseAttempt, readBody } from '#lib/server/api.js';
import { check, result } from '#lib/server/judge.js';
import { findMission, lessonOf } from '#lib/lessons/index.js';
import type { RequestHandler } from './$types';

/** Спроба учня: сервер перевіряє відповідь сам і, якщо відсік пройдено, записує зірки. */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.student) error(401);
	const a = await readBody(request, parseAttempt);
	const m = findMission(a.missionId)!;
	if (!locals.student.lessons.includes(lessonOf(m.id)!.id)) error(403, 'Урок закрито вчителем');
	const passed = check(m, a.step, a.answer);
	if (passed === null) error(400, 'Немає такого кроку');

	const studentId = locals.student.id;
	const mine = and(eq(attempts.studentId, studentId), eq(attempts.missionId, m.id));
	// спроби від минулого проходження відсіку — черга браузера надсилає їх по одній і по порядку
	const lastDone = db.select({ id: max(attempts.id) }).from(attempts).where(and(mine, isNotNull(attempts.stars)));
	const rows = await db
		.select({ step: attempts.step, passed: attempts.passed, hints: attempts.hints, sol: attempts.sol })
		.from(attempts)
		.where(and(mine, gt(attempts.id, sql`coalesce((${lastDone}), 0)`)))
		.orderBy(attempts.id);
	const stars = result(m, [...rows, { ...a, passed }]);

	const insert = db.insert(attempts).values({ studentId, ...a, passed, stars });
	if (stars === null) await insert;
	else
		await db.batch([
			insert,
			// найкращий результат і час першого проходження
			db
				.insert(progress)
				.values({ studentId, missionId: m.id, stars })
				.onConflictDoUpdate({ target: [progress.studentId, progress.missionId], set: { stars: sql`max(${progress.stars}, excluded.stars)` } })
		]);
	return new Response(null, { status: 204 });
};
