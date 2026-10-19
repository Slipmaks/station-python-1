import { hashSecret } from '../src/lib/server/secrets.js';
import { TEACHERS, q } from './helpers.js';

/** Учителі з відомими паролями. Сервер уже запущено, міграції застосовано (webServer у playwright.config.ts). */
export default async function () {
	for (const [login, t] of Object.entries(TEACHERS))
		await q(`insert into teachers (login, name, password_hash, created_at) values (?, ?, ?, ?)`, [login, t.name, await hashSecret(t.password), Date.now()]);
}
