// Створити вчителя або видати йому новий пароль (старі сесії вчителя при цьому завершуються):
//   npm run teacher -- <логін> "<Ім’я Прізвище>"
// БД — із DATABASE_URL (і DATABASE_AUTH_TOKEN для Turso), локально береться з .env.
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { sessions, teachers } from '../src/lib/server/db/schema.ts';
import { hashSecret, newPassword } from '../src/lib/server/secrets.ts';

const [login, name] = process.argv.slice(2);
if (!login || !process.env.DATABASE_URL) {
	console.error('Використання: npm run teacher -- <логін> "<Ім’я>"   (потрібна змінна DATABASE_URL)');
	process.exit(1);
}
const db = drizzle(createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN }), { casing: 'snake_case' });

const password = newPassword();
const passwordHash = await hashSecret(password);
const existing = await db.select({ id: teachers.id }).from(teachers).where(eq(teachers.login, login)).get();
if (existing) {
	await db.update(teachers).set(name ? { passwordHash, name } : { passwordHash }).where(eq(teachers.id, existing.id));
	await db.delete(sessions).where(eq(sessions.teacherId, existing.id));
} else {
	if (!name) {
		console.error('Новому вчителю потрібне ім’я: npm run teacher -- <логін> "<Ім’я>"');
		process.exit(1);
	}
	await db.insert(teachers).values({ login, name, passwordHash });
}
console.log(`${existing ? 'Новий пароль' : 'Вчителя створено'}. Логін: ${login}   Пароль: ${password}`);
