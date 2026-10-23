import type { Page } from '@playwright/test';
import { resolveTask } from '../src/lib/grade.js';
import { findMission } from '../src/lib/lessons/index.js';
import type { Mission } from '../src/lib/types.js';
import { expect, makeClass, modalStars, q, register, run, stars, teacherLogin, test } from './helpers.js';

/* Сервер сам перевіряє відповіді й рахує зірки: підробки з консолі браузера нічого не дають. */

function mission<K extends Mission['kind']>(id: string, kind: K) {
	const m = findMission(id);
	if (m?.kind !== kind) throw new Error(`немає відсіку ${id}`);
	return m as Extract<Mission, { kind: K }>;
}
const radio = resolveTask(mission('radio', 'code'), 0);
const power = resolveTask(mission('power', 'code'), 0);
const repairM = mission('repair', 'code');
const repair = 'steps' in repairM ? repairM.steps.map(s => s.solution) : [];
const archive = mission('archive', 'choice').items.map(i => i.options[i.answer]);
const decoder = mission('decoder', 'choice').items.map(i => i.options[i.answer]);
const scanner = mission('scanner', 'types');
const pool = Object.fromEntries(scanner.pool);

/** Запит від імені учня — з його cookie, як fetch() з консолі браузера. */
const attempt = (page: Page, data: object) => page.request.post('/api/attempt', { data }).then(r => r.status());

test('підробки з консолі браузера не дають проходження', async ({ page }) => {
	const cls = await makeClass('9-В', { unlockAll: true });
	const id = await register(page, cls.code, 'Хитрун');

	expect((await page.request.post('/api/complete', { data: { missionId: 'launch', stars: 3 } })).status(), 'старого /api/complete немає').toBe(404);
	expect(await attempt(page, { missionId: 'radio', step: 0, answer: radio.starter, passed: true })).toBe(204);
	expect((await q('select passed from attempts where student_id = ? order by id desc limit 1', [id]))[0].passed, '«passed: true» від браузера ігнорується').toBe(0);
	expect(await attempt(page, { missionId: 'radio', step: 3, answer: radio.solution }), 'немає такого кроку').toBe(400);
	expect(await attempt(page, { missionId: 'scanner', step: 0, answer: '777 → int' }), 'немає такого значення').toBe(400);

	await attempt(page, { missionId: 'repair', step: repair.length - 1, answer: repair.at(-1) });
	await attempt(page, { missionId: 'archive', step: archive.length - 1, answer: archive.at(-1) });
	const vals = Object.keys(pool).slice(0, scanner.count);
	for (const [k, v] of vals.entries()) await attempt(page, { missionId: 'scanner', step: k, answer: `${v} → ${k < 7 ? pool[v] : pool[v] === 'bool' ? 'int' : 'bool'}` });
	expect(await stars(id), 'лише останній крок ремонту / вікторини, сканер 7 з 10').toEqual({});
});

test('чесні розв’язки через API: зірки рахує сервер; учитель бачить, як пройдено', async ({ page, person }) => {
	const cls = await makeClass('9-В', { unlockAll: true });
	const id = await register(page, cls.code, 'Чесна');

	for (const [s, answer] of repair.entries()) await attempt(page, { missionId: 'repair', step: s, answer });
	expect((await stars(id)).repair, 'ремонт: усі програми по черзі').toBe(3);

	await attempt(page, { missionId: 'radio', step: 0, answer: radio.starter });
	await attempt(page, { missionId: 'radio', step: 0, answer: radio.solution, sol: true });
	expect((await stars(id)).radio, 'показаний розв’язок').toBe(1);
	await attempt(page, { missionId: 'radio', step: 0, answer: radio.solution });
	const done = await q(`select stars from attempts where student_id = ? and mission_id = 'radio' and stars is not null order by id`, [id]);
	expect(done.map(r => r.stars), 'нове проходження рахується з нуля').toEqual([1, 3]);
	expect((await stars(id)).radio, 'у progress — перше проходження, повторне його не покращує').toBe(1);

	const teacher = await person();
	await teacherLogin(teacher, 'olena');
	await teacher.goto(`/teacher/c/${cls.id}/s/${id}`);
	const card = teacher.locator('#m-radio');
	await expect(card).toContainText('відкрито розв’язок');
	await expect(card).toContainText('відсік пройдено: ★★★');
	await expect(card).toContainText('відсік пройдено: ★');
});

test('гра в браузері: зірки у вікні дорівнюють зіркам, які записав сервер', async ({ page }) => {
	const cls = await makeClass('9-В', { unlockAll: true });
	const id = await register(page, cls.code, 'Уважна');
	const star = (missionId: string) => expect.poll(async () => (await stars(id))[missionId]);

	await test.step('вікторина з однією помилкою → 2★', async () => {
		await page.goto('/m/decoder');
		/** Варіанти перемішано — шукаємо за текстом. */
		const option = async (pick: (text: string) => boolean) => {
			const texts = await page.locator('.opt > span:last-child').allTextContents();
			await page.locator('.opt').nth(texts.findIndex(pick)).click();
		};
		await expect(page.locator('.opt').first()).toBeVisible();
		for (const [k, right] of decoder.entries()) {
			if (k === 0) await option(t => t !== right);
			await option(t => t === right);
			await page.locator('.qnext .btn').click();
			if (k < decoder.length - 1) await expect(page.locator('.qnext .btn'), 'наступне запитання').toBeHidden();
		}
		expect(await modalStars(page)).toBe(2);
		await star('decoder').toBe(2);
	});
	await test.step('сканер 9 з 10 → 2★', async () => {
		await page.goto('/m/scanner');
		for (let k = 0; k < scanner.count; k++) {
			const right = pool[(await page.locator('.scan-value span').textContent())!];
			const pick = k > 0 ? right : right === 'int' ? 'str' : 'int';
			await page.locator('.tbtn b').getByText(pick, { exact: true }).click();
			await page.locator('.qnext .btn').click();
			if (k < scanner.count - 1) await expect(page.locator('.qnext .btn'), 'наступний контейнер').toBeHidden();
		}
		expect(await modalStars(page)).toBe(2);
		await star('scanner').toBe(2);
	});
	await test.step('код із підказкою → 2★', async () => {
		await page.goto('/m/power');
		await page.click('.hint-btn');
		await run(page, power.solution);
		expect(await modalStars(page)).toBe(2);
		await star('power').toBe(2);
	});
	await test.step('повторне проходження на ★★★ залік не змінює', async () => {
		await page.goto('/m/power');
		await run(page, power.solution);
		expect(await modalStars(page)).toBe(3);
		await expect(page.locator('.modal')).toContainText('У заліку лишається перше: ★★');
		await expect(page.locator('.stars-total')).toHaveText('★ 6');
		await star('power').toBe(2);
	});
	await test.step('після перезавантаження гра показує зірки сервера', async () => {
		await page.goto('/');
		await expect(page.locator('.stars-total')).toHaveText('★ 6');
	});
});
