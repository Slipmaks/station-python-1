import { fail, redirect } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { classes, students } from '#lib/server/db/schema.js';
import { PIN_TRIES, afterWrongPin, cleanCode, cleanName, hashSecret, isPin, nameKey, verifySecret } from '#lib/server/secrets.js';
import { startSession } from '#lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

const findClass = (code: string) =>
	db.select({ id: classes.id, name: classes.name, code: classes.code }).from(classes).where(eq(classes.code, cleanCode(code))).get();

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.student) redirect(303, '/');
	const code = url.searchParams.get('code')?.trim();
	if (!code) return { cls: null, roster: [], code: '' };
	const cls = await findClass(code);
	if (!cls) return { cls: null, roster: [], code };
	const roster = await db.select({ id: students.id, name: students.name }).from(students).where(eq(students.classId, cls.id)).orderBy(asc(students.name));
	return { cls, roster, code: cls.code };
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const f = await request.formData();
		// у кожній відповіді fail() — однакові поля, інакше TypeScript губить їх в ActionData
		const id = Number(f.get('student'));
		const cls = await findClass(String(f.get('code') ?? ''));
		if (!cls) return fail(400, { login: 'Клас не знайдено — перевір код.', student: id });
		const st = await db.select().from(students).where(and(eq(students.id, id), eq(students.classId, cls.id))).get();
		if (!st) return fail(400, { login: 'Обери своє ім’я у списку.', student: id });

		const now = Date.now();
		if (st.lockedUntil && st.lockedUntil.getTime() > now) {
			const min = Math.ceil((st.lockedUntil.getTime() - now) / 60_000);
			return fail(429, { login: `Забагато невдалих спроб. Спробуй через ${min} хв або попроси вчителя.`, student: id });
		}
		if (!(await verifySecret(String(f.get('pin') ?? ''), st.pinHash))) {
			const next = afterWrongPin(st.failedPins, now);
			await db.update(students).set(next).where(eq(students.id, st.id));
			return fail(400, {
				login: next.lockedUntil ? 'Забагато невдалих спроб — вхід заблоковано на 10 хвилин.' : `Неправильний PIN. Залишилось спроб: ${PIN_TRIES - next.failedPins}.`,
				student: id
			});
		}
		if (st.failedPins || st.lockedUntil) await db.update(students).set({ failedPins: 0, lockedUntil: null }).where(eq(students.id, st.id));
		await startSession(cookies, { studentId: st.id });
		redirect(303, '/');
	},

	register: async ({ request, cookies }) => {
		const f = await request.formData();
		const name = cleanName(String(f.get('name') ?? ''));
		const cls = await findClass(String(f.get('code') ?? ''));
		if (!cls) return fail(400, { register: 'Клас не знайдено — перевір код.', name });
		const pin = String(f.get('pin') ?? '');
		if (name.length < 2 || name.length > 40) return fail(400, { register: 'Ім’я — від 2 до 40 символів.', name });
		if (!isPin(pin)) return fail(400, { register: 'PIN — це рівно 4 цифри.', name });
		if (pin !== String(f.get('pin2') ?? '')) return fail(400, { register: 'PIN-коди не збігаються.', name });

		const key = nameKey(name);
		const taken = 'Таке ім’я в класі вже є. Якщо це ти — обери його у списку вище. Якщо ні — додай першу літеру прізвища.';
		if (await db.select({ id: students.id }).from(students).where(and(eq(students.classId, cls.id), eq(students.nameKey, key))).get())
			return fail(400, { register: taken, name });
		let studentId: number;
		try {
			[{ id: studentId }] = await db.insert(students).values({ classId: cls.id, name, nameKey: key, pinHash: await hashSecret(pin) }).returning({ id: students.id });
		} catch (e) {
			// одночасна реєстрація з тим самим ім’ям
			if (String(e).includes('UNIQUE')) return fail(400, { register: taken, name });
			throw e;
		}
		await startSession(cookies, { studentId });
		redirect(303, '/');
	}
};
