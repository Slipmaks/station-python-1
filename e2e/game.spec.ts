import { LESSONS } from '../src/lib/lessons/index.js';
import { expect, makeClass, modalStars, register, run, test } from './helpers.js';

test('сторінка уроків → станція уроку → радіорубка → вікторина', async ({ page }) => {
	const cls = await makeClass('9-Д');
	await register(page, cls.code, 'Регрес');

	await test.step('сторінка уроків: ім’я, урок 1 відкрито, порожні уроки «готуються»', async () => {
		await expect(page.locator('.hero h1')).toContainText('Регрес');
		const rows = page.locator('.mlist .mrow');
		await expect(rows).toHaveCount(LESSONS.length);
		await expect(rows.first()).toBeEnabled();
		for (const [k, l] of LESSONS.entries()) if (!l.missions.length) await expect(rows.nth(k)).toContainText('готується');
	});
	await test.step('урок 1: 12 відсіків і станція', async () => {
		await page.locator('.mlist .mrow').first().click();
		await expect(page).toHaveURL('/l/intro');
		await expect(page.locator('.mlist li')).toHaveCount(12);
		await expect(page.locator('.station .mod')).toHaveCount(12);
	});
	await test.step('закритий відсік → станція уроку', async () => {
		await page.goto('/m/launch');
		await expect(page).toHaveURL('/l/intro');
	});
	await test.step('радіорубка: різниця у виводі, потім успіх — 3★', async () => {
		await page.locator('.mlist button').first().click();
		await expect(page).toHaveURL('/m/radio');
		await run(page, "print('Привіт')");
		await expect(page.locator('.verdict .diff')).toContainText('Привіт, Земле!');
		await run(page, "print('Привіт, Земле!')");
		await expect(page.locator('.modal h2')).toContainText('Радіорубка');
		expect(await modalStars(page), 'одна невдала спроба зірок не знімає').toBe(3);
	});
	await test.step('«Наступний відсік» відкриває вікторину й закриває вікно', async () => {
		await page.locator('.modal .btn', { hasText: 'Наступний' }).click();
		await expect(page).toHaveURL('/m/archive');
		await expect(page.locator('.modal')).toHaveCount(0);
		await expect(page.locator('.pt-long')).toHaveText('Відновлено 1 з 12');
	});
	await test.step('вікторина клавішами 1–4', async () => {
		for (let k = 0; k < 5; k++) {
			for (let key = 1; key <= 4 && !(await page.locator('.qnext .btn').isVisible()); key++) {
				// клавіші ловить картка запитання — фокус має бути всередині неї
				await page.locator('.opt:not([disabled])').first().focus();
				await page.keyboard.press(String(key));
			}
			await page.locator('.qnext .btn').click();
		}
		await expect(page.locator('.modal h2')).toContainText('Бортовий архів');
	});
	await test.step('«До станції» → станція уроку; прогрес переживає перезавантаження', async () => {
		await page.locator('.modal .btn.plain').click();
		await expect(page).toHaveURL('/l/intro');
		await expect(page.locator('.modal')).toHaveCount(0);
		await page.reload();
		await expect(page.locator('.mlist li.done')).toHaveCount(2);
	});
});

test('відкриті всі відсіки: помилка з поясненням, ремонт, сканер', async ({ page }) => {
	const cls = await makeClass('9-Д', { unlockAll: true });
	await register(page, cls.code, 'Регрес 2');
	await page.goto('/l/intro');
	await expect(page.locator('.mrow:disabled')).toHaveCount(0);

	await test.step('двигун: TypeError + пояснення', async () => {
		await page.goto('/m/engine');
		await page.click('.run');
		await expect(page.locator('.console .err')).toContainText('TypeError');
		await expect(page.locator('.console .explain')).toBeVisible();
	});
	await test.step('ремонт: перехід до кроку 2 з новим стартовим кодом', async () => {
		await page.goto('/m/repair');
		await run(page, "print('Системи в нормі')");
		await expect(page.locator('.brief h3').first()).toHaveText('Програма 2 з 4');
		await expect(page.locator('textarea')).toHaveValue('print(Готово)\n');
	});
	await test.step('сканер: 10 відповідей клавішею 1 → підсумок', async () => {
		await page.goto('/m/scanner');
		await expect(page.locator('.scan-value')).toBeVisible();
		for (let k = 0; k < 10; k++) {
			await page.keyboard.press('1');
			await page.locator('.qnext .btn').click();
		}
		await expect(page.locator('.qcard h2, .modal').first()).toBeVisible();
	});
});

test('пісочниця: input(), >>> бачить змінні, повторний запуск', async ({ page }) => {
	const cls = await makeClass('9-Д');
	await register(page, cls.code, 'Регрес 3');
	await page.goto('/sandbox');
	await expect(page.locator('textarea')).toHaveAttribute('autocorrect', 'off');

	const field = page.locator('.in-line input');
	await run(page, "name = input('Ім’я? ')\nprint('Привіт,', name)");
	await expect(field).toBeFocused();
	await field.fill('Марко');
	await field.press('Enter');
	await expect(page.locator('.console')).toContainText('Привіт, Марко');

	const repl = page.locator('.repl input');
	await repl.fill('name * 2');
	await repl.press('Enter');
	await expect(page.locator('.console')).toContainText("'МаркоМарко'");

	await run(page, "a = input('A? ')\nb = input('B? ')\nprint(a, b)");
	await expect(field).toBeFocused();
	await field.fill('x');
	await field.press('Enter');
	await expect(field, 'друге поле введення — порожнє й у фокусі').toBeFocused();
	await expect(field).toHaveValue('');
});
