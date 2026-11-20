import { error, redirect } from '@sveltejs/kit';
import { and, eq, lt } from 'drizzle-orm';
import { DEMO_CLASS_CODE } from '$app/env/private';
import { db } from '#lib/server/db/index.js';
import { classes, students } from '#lib/server/db/schema.js';
import { cleanCode, hashSecret, nameKey, newPin, newToken } from '#lib/server/secrets.js';
import { startSession } from '#lib/server/session.js';
import { deleteStudents } from '#lib/server/students.js';
import type { Actions, PageServerLoad } from './$types';

/* Демо для гостей з портфоліо: кожен гість — новий учень демо-класу; учні демо-класу живуть добу. */

const DAY = 24 * 3600_000;

async function demoClass() {
	const cls = DEMO_CLASS_CODE && (await db.select({ id: classes.id }).from(classes).where(eq(classes.code, cleanCode(DEMO_CLASS_CODE))).get());
	if (!cls) error(404, 'Not found');
	return cls;
}

export const load: PageServerLoad = async ({ locals }) => {
	await demoClass();
	if (locals.student) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		const cls = await demoClass();
		const old = await db.select({ id: students.id }).from(students).where(and(eq(students.classId, cls.id), lt(students.createdAt, new Date(Date.now() - DAY))));
		await deleteStudents(old.map(s => s.id));

		// PIN нікому не показуємо: гість повертається лише за cookie
		const pinHash = await hashSecret(newToken());
		for (let i = 0; ; i++) {
			const name = `Гість-${newPin()}`;
			try {
				const [{ id }] = await db.insert(students).values({ classId: cls.id, name, nameKey: nameKey(name), pinHash }).returning({ id: students.id });
				await startSession(cookies, { studentId: id });
				break;
			} catch (e) {
				// ім’я вже зайняте іншим гостем
				if (i < 5 && String(e).includes('UNIQUE')) continue;
				throw e;
			}
		}
		redirect(303, '/');
	}
};
