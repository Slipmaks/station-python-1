import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { teachers } from '#lib/server/db/schema.js';
import { verifySecret } from '#lib/server/secrets.js';
import { startSession } from '#lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.teacher) redirect(303, '/teacher');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const f = await request.formData();
		const login = String(f.get('login') ?? '').trim();
		const t = await db.select().from(teachers).where(eq(teachers.login, login)).get();
		if (!t || !(await verifySecret(String(f.get('password') ?? ''), t.passwordHash)))
			return fail(400, { login, error: 'Неправильний логін або пароль.' });
		await startSession(cookies, { teacherId: t.id });
		redirect(303, '/teacher');
	}
};
