import { expect, logout, q, register, run, studentLogin, teacherLogin, test } from './helpers.js';

test('урок у класі: таблиця, сторінка учня, новий PIN, чужий учитель, видалення учня', async ({ person }) => {
	const teacher = await person(), olya = await person(), petro = await person(), ivan = await person();
	let classId = 0, code = '', petroId = 0;
	const rows = teacher.locator('tbody tr');
	const olyaCells = rows.filter({ hasText: 'Оля К.' }).locator('td');

	await test.step('новий клас → сторінка класу з кодом і підказкою; «Відкрити всі»', async () => {
		await teacherLogin(teacher, 'olena');
		await teacher.fill('#cname', '9-Б');
		await teacher.click('form[action="?/create"] button');
		await expect(teacher).toHaveURL(/\/teacher\/c\/\d+$/);
		classId = Number(teacher.url().split('/').pop());
		code = (await teacher.locator('.class-head .class-code').textContent())!.trim();
		await expect(teacher.locator('main')).toContainText('Ще ніхто не увійшов');
		await teacher.click('form[action$="/unlock"] button');
		await expect(teacher.locator('.unlock')).toContainText('відкриті одразу');
	});
	await test.step('учні грають; Петро блокується неправильними PIN', async () => {
		const olyaId = await register(olya, code, 'Оля К.');
		await olya.goto('/m/radio');
		await run(olya, "print('Привіт')");
		await run(olya, "print('Привіт, Земле!')");
		await expect(olya.locator('.modal')).toBeVisible();
		await olya.goto('/m/power');
		for (let k = 0; k < 5; k++) await run(olya, `print(${k})`);
		await expect.poll(async () => (await q(`select count(*) n from attempts where student_id = ? and mission_id = 'power'`, [olyaId]))[0].n).toBe(5);

		petroId = await register(petro, code, 'Петро', '4321');
		await logout(petro);
		for (let k = 1; k <= 5; k++) {
			await studentLogin(petro, code, 'Петро', '0000');
			await expect(petro.locator('.login-err')).toContainText(k < 5 ? `Залишилось спроб: ${5 - k}` : 'заблоковано');
		}
	});
	await test.step('таблиця класу', async () => {
		await teacher.goto(`/teacher/c/${classId}`);
		await expect(teacher.locator('tbody .who a'), 'учні за абеткою').toHaveText(['Оля К.', 'Петро']);
		await expect(olyaCells.nth(0)).toHaveText('★★★');
		await expect(olyaCells.nth(0)).toHaveClass(/done/);
		await expect(olyaCells.nth(3), 'енергоблок: 5 невдалих — «варто підійти»').toHaveText('5');
		await expect(olyaCells.nth(3)).toHaveClass(/stuck/);
		await expect(olyaCells.nth(12)).toHaveText('1/12');
		await expect(olyaCells.nth(13)).toHaveText('3');
		await expect(olyaCells.nth(14), '3★ з 36 у 12-бальній шкалі').toHaveText('1');
		await expect(olyaCells.nth(15)).toHaveText('щойно');
		await expect(rows.filter({ hasText: 'Петро' })).toContainText('вхід заблоковано');
		await expect(teacher.locator('tfoot td').first(), 'радіорубку пройшов 1').toHaveText('1');
	});
	await test.step('таблиця оновлюється сама (кожні 20 с)', async () => {
		await q(`insert into progress (student_id, mission_id, stars, completed_at) values (?, 'radio', 2, ?)`, [petroId, Date.now()]);
		await expect(rows.filter({ hasText: 'Петро' }).locator('td').first()).toHaveText('★★', { timeout: 26_000 });
	});
	await test.step('сторінка учня: код кожної спроби', async () => {
		await olyaCells.nth(3).locator('a').click();
		await expect(teacher).toHaveURL(/\/s\/\d+#m-power$/);
		const power = teacher.locator('#m-power .attempts li');
		await expect(power).toHaveCount(5);
		await expect(teacher.locator('#m-power .attempts li.ok')).toHaveCount(0);
		await expect(power.first().locator('pre'), 'найновіша спроба зверху').toHaveText('print(4)');
		const radio = teacher.locator('#m-radio');
		await expect(radio.locator('.attempts li.ok pre')).toHaveText("print('Привіт, Земле!')");
		await expect(radio.locator('h3 .st')).toHaveAttribute('aria-label', '3 з 3 зірок');
		await expect(radio.locator('.attempt-meta time').first(), 'час — у браузері, за місцевим часом').toHaveText(/\d{2}:\d{2}/);
	});
	await test.step('новий PIN завершує сесію учня; з ним учень входить, прогрес на місці', async () => {
		await olya.goto('/');
		await expect(olya).toHaveURL('/');
		await teacher.click('form[action="?/resetPin"] button');
		const pin = (await teacher.locator('.pin-box b').textContent())!;
		expect(pin).toMatch(/^\d{4}$/);
		await olya.goto('/');
		await expect(olya).toHaveURL('/login');
		await studentLogin(olya, code, 'Оля К.', pin);
		await expect(olya).toHaveURL('/');
		await olya.goto('/l/intro');
		await expect(olya.locator('.mlist li.done')).toHaveCount(1);
	});
	await test.step('новий PIN знімає блокування', async () => {
		await teacher.goto(`/teacher/c/${classId}/s/${petroId}`);
		await teacher.click('form[action="?/resetPin"] button');
		const pin = (await teacher.locator('.pin-box b').textContent())!;
		await studentLogin(petro, code, 'Петро', pin);
		await expect(petro).toHaveURL('/');
	});
	await test.step('чужий учитель і учень не мають доступу до класу', async () => {
		await teacherLogin(ivan, 'ivan');
		await expect(ivan).toHaveURL('/teacher');
		await expect(ivan.locator('main')).not.toContainText('9-Б');
		expect((await ivan.request.get(`/teacher/c/${classId}`)).status()).toBe(404);
		expect((await ivan.request.get(`/teacher/c/${classId}/s/${petroId}`)).status()).toBe(404);
		const action = { headers: { 'x-sveltekit-action': 'true' }, multipart: { value: '0' } };
		await ivan.request.post(`/teacher/c/${classId}/s/${petroId}?/delete`, action);
		await ivan.request.post(`/teacher/c/${classId}?/unlock`, action);
		expect((await q('select count(*) n from students where id = ?', [petroId]))[0].n, 'Петро на місці').toBe(1);
		expect((await q('select unlock_all from classes where id = ?', [classId]))[0].unlock_all, 'клас досі «відкриті всі»').toBe(1);
		expect((await petro.request.get(`/teacher/c/${classId}`)).url(), 'учня відправляє на вхід учителя').toContain('/teacher/login');
	});
	await test.step('видалення учня разом з усіма його даними', async () => {
		await teacher.goto(`/teacher/c/${classId}/s/${petroId}`);
		await teacher.click('.danger-zone summary');
		await teacher.click('form[action="?/delete"] button');
		await expect(teacher).toHaveURL(`/teacher/c/${classId}`);
		await expect(rows).toHaveCount(1);
		const left = await q(
			`select (select count(*) from students where id = ?1) s, (select count(*) from progress where student_id = ?1) p, (select count(*) from attempts where student_id = ?1) a, (select count(*) from sessions where student_id = ?1) x`,
			[petroId]
		);
		expect({ ...left[0] }).toEqual({ s: 0, p: 0, a: 0, x: 0 });
		await petro.goto('/');
		await expect(petro).toHaveURL('/login');
	});
});
