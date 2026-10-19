import { test as base, expect, type Page } from '@playwright/test';
import { createClient, type InValue } from '@libsql/client';
import { newClassCode } from '../src/lib/server/secrets.js';

/* Спільне для E2E: БД тестового сервера, учителі, швидке створення класу й учня. */

export const db = createClient({ url: 'file:e2e.db' });
// у той самий файл пише й сервер — чекати на його блокування, а не падати з SQLITE_BUSY
await db.execute('PRAGMA busy_timeout = 5000');
export const q = async (sql: string, args: InValue[] = []) => (await db.execute({ sql, args })).rows;

/** Учителі тестової БД (створює global-setup.ts). */
export const TEACHERS = {
	olena: { name: 'Олена Петрівна', password: 'E2E-OLENA-0001' },
	ivan: { name: 'Іван Іванович', password: 'E2E-IVAN-0002' }
};

/** Клас одразу в БД — коли саме створення класу не перевіряємо. */
export async function makeClass(name: string, { unlockAll = false, teacher = 'olena' } = {}) {
	const code = newClassCode();
	const [row] = await q(
		`insert into classes (teacher_id, name, code, unlock_all, created_at) values ((select id from teachers where login = ?), ?, ?, ?, ?) returning id`,
		[teacher, name, code, unlockAll ? 1 : 0, Date.now()]
	);
	return { id: Number(row.id), code };
}

export async function register(page: Page, code: string, name: string, pin = '1234') {
	await page.goto('/login?code=' + code);
	await page.fill('#name', name);
	await page.fill('#pin1', pin);
	await page.fill('#pin2', pin);
	await page.click('form[action$="/register"] button');
	await expect(page).toHaveURL('/');
	await expect(page.locator('.mlist')).toBeVisible();
	return Number((await q('select id from students where name = ? order by id desc limit 1', [name]))[0].id);
}

export async function studentLogin(page: Page, code: string, name: string, pin: string) {
	await page.goto('/login?code=' + code);
	await page.locator('.roster label', { hasText: name }).click();
	await page.fill('#pin', pin);
	await page.click('form[action$="/login"] button');
}

export async function teacherLogin(page: Page, login: keyof typeof TEACHERS, password = TEACHERS[login].password) {
	await page.goto('/teacher/login');
	await page.fill('#login', login);
	await page.fill('#password', password);
	await page.click('form button');
}

export async function logout(page: Page) {
	await page.click('form[action="/logout"] button');
	await expect(page).toHaveURL(/\/login$/);
}

/** Запустити код у відкритому відсіку. */
export async function run(page: Page, code: string) {
	await page.locator('textarea').fill(code);
	await page.click('.run');
}

/** Зірки у вікні «Відсік працює»: «2 з 3 зірок» → 2. */
export async function modalStars(page: Page) {
	return Number((await page.locator('.modal .big-stars').getAttribute('aria-label'))!.split(' ')[0]);
}

/** Зірки учня в БД: { radio: 3, … }. */
export async function stars(studentId: number) {
	const rows = await q('select mission_id, stars from progress where student_id = ?', [studentId]);
	return Object.fromEntries(rows.map(r => [r.mission_id as string, Number(r.stars)]));
}

/** Помилки й попередження з консолі будь-якої сторінки тесту валять тест (крім навмисних 4xx-запитів). */
export const test = base.extend<{ errors: string[]; person: () => Promise<Page> }>({
	errors: async ({}, use) => {
		const errors: string[] = [];
		await use(errors);
		expect(errors, 'консоль браузера').toEqual([]);
	},
	page: async ({ page, errors }, use) => {
		watch(page, errors);
		await use(page);
	},
	/** Ще одна людина за іншим комп’ютером: окремий контекст — свої cookie. */
	person: async ({ browser, errors }, use) => {
		const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
		await use(async () => {
			const c = await browser.newContext();
			contexts.push(c);
			const p = await c.newPage();
			watch(p, errors);
			return p;
		});
		for (const c of contexts) await c.close();
	}
});
export { expect };

function watch(page: Page, errors: string[]) {
	page.on('pageerror', e => errors.push(String(e)));
	page.on('console', m => {
		if ((m.type() === 'error' || m.type() === 'warning') && !m.text().startsWith('Failed to load resource')) errors.push(`${m.type()}: ${m.text()}`);
	});
}
