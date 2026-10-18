import { fail, redirect } from '@sveltejs/kit';
import { and, asc, count, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { classes, students } from '#lib/server/db/schema.js';
import { newClassCode } from '#lib/server/secrets.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const t = locals.teacher;
	if (!t) redirect(303, '/teacher/login');
	const list = await db
		.select({ id: classes.id, name: classes.name, code: classes.code, unlockAll: classes.unlockAll, students: count(students.id) })
		.from(classes)
		.leftJoin(students, eq(students.classId, classes.id))
		.where(eq(classes.teacherId, t.id))
		.groupBy(classes.id)
		.orderBy(asc(classes.name));
	return { teacher: t, classes: list };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const t = locals.teacher;
		if (!t) redirect(303, '/teacher/login');
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name || name.length > 30) return fail(400, { error: 'Назва класу — до 30 символів.', name });
		// код випадковий; збіг малоймовірний, але унікальність гарантує БД — пробуємо ще раз
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await db.insert(classes).values({ teacherId: t.id, name, code: newClassCode() });
				return { created: name };
			} catch (e) {
				if (!String(e).includes('UNIQUE')) throw e;
			}
		}
		return fail(500, { error: 'Не вдалося створити код класу — спробуйте ще раз.', name });
	},

	unlock: async ({ request, locals }) => {
		const t = locals.teacher;
		if (!t) redirect(303, '/teacher/login');
		const f = await request.formData();
		await db
			.update(classes)
			.set({ unlockAll: f.get('value') === '1' })
			.where(and(eq(classes.id, Number(f.get('id'))), eq(classes.teacherId, t.id)));
	}
};
