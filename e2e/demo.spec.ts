import { expect, q, test } from './helpers.js';

test('демо: гість входить одним кліком, гості старші за добу видаляються', async ({ page }) => {
	await q(`insert or ignore into classes (teacher_id, name, code, created_at) values ((select id from teachers where login = 'olena'), 'Демо', 'DEMO23', ?)`, [Date.now()]);
	const [cls] = await q(`select id from classes where code = 'DEMO23'`);
	const [old] = await q(`insert into students (class_id, name, name_key, pin_hash, created_at) values (?, 'Старий гість', 'старий гість', 'x:x', ?) returning id`, [cls.id, Date.now() - 2 * 24 * 3600_000]);

	await page.goto('/demo');
	await page.click('form button');
	await expect(page).toHaveURL('/');
	await expect(page.locator('.hero h1')).toContainText(/Гість-\d{4}/);
	expect(await q('select id from students where id = ?', [old.id])).toEqual([]);

	await page.goto('/demo');
	await expect(page, 'учень, що вже увійшов, продовжує гру').toHaveURL('/');
});
