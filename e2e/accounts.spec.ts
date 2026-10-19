import { expect, logout, makeClass, q, register, run, stars, studentLogin, teacherLogin, test } from './helpers.js';

test('без входу гра недоступна; учитель: неправильний пароль, новий клас, вихід', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL('/login');

	await teacherLogin(page, 'olena', 'неправильний');
	await expect(page.locator('.form-err')).toContainText('Неправильний');
	await teacherLogin(page, 'olena');
	await expect(page).toHaveURL('/teacher');
	await page.fill('#cname', '9-А');
	await page.click('form[action="?/create"] button');
	await expect(page).toHaveURL(/\/teacher\/c\/\d+$/);
	await expect(page.locator('.class-code')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/);
	await logout(page);
	await expect(page).toHaveURL('/teacher/login');
});

test('реєстрація: код у будь-якому вигляді, різні PIN, те саме ім’я вдруге', async ({ page }) => {
	const cls = await makeClass('9-А');
	await page.goto('/login');
	await page.fill('#code', ` ${cls.code.toLowerCase().slice(0, 3)} ${cls.code.toLowerCase().slice(3)}`);
	await page.click('.intro-form button');
	await expect(page.locator('.login-class')).toContainText('9-А');

	await page.fill('#name', 'Оля К.');
	await page.fill('#pin1', '1234');
	await page.fill('#pin2', '1235');
	await page.click('form[action$="/register"] button');
	await expect(page.locator('.login-err')).toContainText('не збігаються');
	await expect(page.locator('#name'), 'ім’я не треба вводити вдруге').toHaveValue('Оля К.');

	await page.fill('#pin1', '1234');
	await page.fill('#pin2', '1234');
	await page.click('form[action$="/register"] button');
	await expect(page).toHaveURL('/');
	await expect(page.locator('.hero h1')).toContainText('Оля К.');
	await logout(page);

	await page.goto('/login?code=' + cls.code);
	await page.fill('#name', 'оля  к.');
	await page.fill('#pin1', '4321');
	await page.fill('#pin2', '4321');
	await page.click('form[action$="/register"] button');
	await expect(page.locator('.login-err'), 'інший регістр і пробіли — те саме ім’я').toContainText('вже є');
});

test('гра пише в БД: спроби, зірки, чернетка; без мережі нічого не губиться', async ({ page, context }) => {
	const cls = await makeClass('9-А');
	const id = await register(page, cls.code, 'Оля К.');
	const attempts = async () => (await q('select passed, answer from attempts where student_id = ? order by id', [id])).map(r => ({ ...r }));

	await test.step('спроби й зірки', async () => {
		await page.goto('/l/intro');
		await page.locator('.mlist button').first().click();
		await expect(page).toHaveURL('/m/radio');
		await run(page, "print('Привіт')");
		await expect(page.locator('.verdict.bad')).toBeVisible();
		await run(page, "print('Привіт, Земле!')");
		await expect(page.locator('.modal')).toBeVisible();
		await expect.poll(() => stars(id)).toEqual({ radio: 3 });
		expect(await attempts()).toEqual([{ passed: 0, answer: "print('Привіт')" }, { passed: 1, answer: "print('Привіт, Земле!')" }]);
	});
	await test.step('чернетка зберігається на сервері й повертається після перезавантаження', async () => {
		await page.goto('/m/radio');
		await page.locator('textarea').fill('print(24 * 60)');
		await expect.poll(async () => JSON.parse(String((await q('select data from workspaces where student_id = ?', [id]))[0]?.data ?? '{}')).code?.radio).toBe('print(24 * 60)');
		await page.reload();
		await expect(page.locator('textarea')).toHaveValue('print(24 * 60)');
	});
	await test.step('без мережі — попередження; мережа повернулась — спробу дописано', async () => {
		const before = (await attempts()).length;
		await context.setOffline(true);
		await page.click('.run');
		await expect(page.locator('.net-warn')).toBeVisible();
		await context.setOffline(false);
		await expect(page.locator('.net-warn')).toBeHidden();
		await expect.poll(async () => (await attempts()).length).toBe(before + 1);
	});
	await test.step('прогрес після перезавантаження; після виходу гра недоступна', async () => {
		await page.goto('/l/intro');
		await expect(page.locator('.mlist li.done')).toHaveCount(1);
		await logout(page);
		await page.goto('/');
		await expect(page).toHaveURL('/login');
	});
});

test('PIN: лічильник спроб, блокування на 10 хвилин, потім вхід', async ({ page }) => {
	const cls = await makeClass('9-А');
	const id = await register(page, cls.code, 'Оля К.');
	await logout(page);

	for (let k = 1; k <= 4; k++) {
		await studentLogin(page, cls.code, 'Оля К.', '0000');
		await expect(page.locator('.login-err')).toContainText(`Залишилось спроб: ${5 - k}`);
	}
	await studentLogin(page, cls.code, 'Оля К.', '0000');
	await expect(page.locator('.login-err')).toContainText('заблоковано');
	await studentLogin(page, cls.code, 'Оля К.', '1234');
	await expect(page.locator('.login-err'), 'навіть правильний PIN не пускає').toContainText('Спробуй через');

	await q('update students set locked_until = ? where id = ?', [Date.now() - 1000, id]); // «минуло 10 хвилин»
	await studentLogin(page, cls.code, 'Оля К.', '1234');
	await expect(page).toHaveURL('/');
	expect({ ...(await q('select failed_pins, locked_until from students where id = ?', [id]))[0] }).toEqual({ failed_pins: 0, locked_until: null });
});

test('другий учень починає з нуля; «Відкрити всі відсіки» від учителя', async ({ page }) => {
	const cls = await makeClass('9-А (2)');
	const olya = await register(page, cls.code, 'Оля К.');
	await q('insert into progress (student_id, mission_id, stars, completed_at) values (?, ?, 3, ?)', [olya, 'radio', Date.now()]);
	await logout(page);

	await register(page, cls.code, 'Петро', '4321');
	await page.goto('/l/intro');
	await expect(page.locator('.mlist li.done')).toHaveCount(0);
	await expect(page.locator('.mrow:disabled')).toHaveCount(11);
	await logout(page);

	await teacherLogin(page, 'olena');
	const card = page.locator('.class-card', { hasText: '9-А (2)' });
	await expect(card).toContainText('Учнів: 2');
	await card.click();
	await page.click('form[action$="/unlock"] button');
	await expect(page.locator('.unlock')).toContainText('відкриті одразу');
	await page.goto('/');
	await expect(page, 'учитель, відкривши гру, потрапляє в кабінет').toHaveURL('/teacher');
	await logout(page);

	await studentLogin(page, cls.code, 'Петро', '4321');
	await expect(page).toHaveURL('/');
	await page.goto('/l/intro');
	await expect(page.locator('.mrow:disabled')).toHaveCount(0);
});
