import { LESSONS, lessonNo } from '../src/lib/lessons/index.js';
import { expect, makeClass, q, register, run, teacherLogin, test } from './helpers.js';

/* Уроки: сторінка уроків, учитель відкриває й закриває урок класу. */

const opened = async (classId: number) => (await q('select open_lessons from classes where id = ?', [classId]))[0].open_lessons;
const empty = LESSONS.find(l => !l.missions.length);

test('новий клас: відкрито лише урок 1; учень ходить уроками', async ({ page, person }) => {
	const teacher = await person();
	await teacherLogin(teacher, 'olena');
	await teacher.fill('#cname', '9-Г');
	await teacher.click('form[action="?/create"] button');
	await expect(teacher).toHaveURL(/\/teacher\/c\/\d+$/);
	const classId = Number(teacher.url().split('/').pop());
	const code = (await teacher.locator('.class-head .class-code').textContent())!.trim();
	expect(await opened(classId)).toBe('["intro"]');
	await expect(teacher.locator('.lesson-tabs a').first()).toHaveText('Урок 1відкрито');
	await expect(teacher.locator('.lesson-bar h2'), 'за замовчуванням — останній відкритий урок').toHaveText('Урок 1. Перші кроки в Python');
	await expect(teacher.locator('.lesson-bar button')).toHaveText('Закрити урок');

	await register(page, code, 'Оля');
	const rows = page.locator('.mlist .mrow');
	await expect(rows.first()).toBeEnabled();
	await expect(rows.first()).toContainText('Відновлено 0 з 12 відсіків');
	for (const l of LESSONS.slice(1)) await expect(rows.nth(lessonNo(l) - 1), `урок ${lessonNo(l)} закрито`).toBeDisabled();
	await expect(page.locator('.topbar .cells'), 'на сторінці уроків — без клітинок відсіків').toHaveCount(0);

	await rows.first().click();
	await expect(page).toHaveURL('/l/intro');
	await expect(page.locator('.hero h1')).toHaveText('Урок 1. Перші кроки в Python');
	await expect(page.locator('.crumbs .back')).toContainText('Усі уроки');
	await page.goto('/m/radio');
	await run(page, "print('Привіт, Земле!')");
	await page.locator('.modal .btn.plain').click();
	await expect(page, '«До станції» з вікна').toHaveURL('/l/intro');
	await expect(page.locator('.modal')).toHaveCount(0);
	await expect(page.locator('.pt-long')).toHaveText('Відновлено 1 з 12');
	await page.goto('/');
	await expect(rows.first()).toContainText('Відновлено 1 з 12 відсіків');
	await expect(rows.first()).toContainText('★ 3');
});

test('учитель закриває й відкриває урок — учень бачить це без перезавантаження', async ({ page, person }) => {
	const cls = await makeClass('9-Г (2)');
	await register(page, cls.code, 'Оля');
	const teacher = await person();
	await teacherLogin(teacher, 'olena');
	await teacher.goto(`/teacher/c/${cls.id}`);
	const lessonRow = page.locator('.mlist .mrow').first();

	await teacher.click('.lesson-bar button');
	await expect(teacher.locator('.lesson-bar')).toContainText('Учні поки не бачать');
	expect(await opened(cls.id)).toBe('[]');
	await page.bringToFront(); // автооновлення працює, лише поки вкладка на екрані
	await expect(lessonRow).toBeDisabled({ timeout: 20_000 });
	await expect(lessonRow).toContainText('Відкриє вчитель');

	await page.goto('/l/intro');
	await expect(page, 'станція закритого уроку').toHaveURL('/');
	await page.goto('/m/radio');
	await expect(page, 'відсік закритого уроку').toHaveURL('/');
	const st = await page.request.post('/api/attempt', { data: { missionId: 'radio', step: 0, answer: 'print(1)' } });
	expect(st.status(), 'спроби в закритому уроці сервер не приймає').toBe(403);

	await teacher.click('.lesson-bar button');
	await expect(teacher.locator('.lesson-bar')).toContainText('Урок відкрито учням');
	await page.bringToFront();
	await expect(lessonRow).toBeEnabled({ timeout: 20_000 });
});

test('кабінет: порожній урок не відкрити; таблиця й сторінка учня — за уроками', async ({ page, person }) => {
	const cls = await makeClass('9-Г (3)');
	const id = await register(page, cls.code, 'Оля');
	await page.goto('/m/radio');
	await run(page, "print('Привіт, Земле!')");
	await expect(page.locator('.modal')).toBeVisible();

	const teacher = await person();
	await teacherLogin(teacher, 'olena');
	if (empty) {
		await teacher.goto(`/teacher/c/${cls.id}?lesson=${empty.id}`);
		await expect(teacher.locator('main')).toContainText('Урок ще готується');
		await expect(teacher.locator('.lesson-bar form')).toHaveCount(0);
		await expect(teacher.locator('.report')).toHaveCount(0);
		await teacher.request.post(`/teacher/c/${cls.id}?lesson=${empty.id}&/lesson`, { headers: { 'x-sveltekit-action': 'true' }, multipart: { open: '1' } });
		expect(await opened(cls.id), 'порожній урок відкрити не можна').toBe('["intro"]');
	}
	await teacher.goto(`/teacher/c/${cls.id}`);
	await expect(teacher.locator('.report tbody tr td').first(), 'таблиця — за уроком 1').toHaveText('★★★');
	await teacher.goto(`/teacher/c/${cls.id}/s/${id}`);
	await expect(teacher.locator('.lesson-h')).toHaveText(['Урок 1. Перші кроки в Python']);
});

test('старе збереження (celebrated — один прапорець) відкривається й переписується', async ({ page }) => {
	const cls = await makeClass('9-Г (4)');
	const id = await register(page, cls.code, 'Оля');
	await page.goto('/m/radio');
	await run(page, 'print(1)'); // невдалий запуск зберігає робочий стан
	await expect.poll(async () => (await q('select count(*) n from workspaces where student_id = ?', [id]))[0].n).toBe(1);
	await q(`update workspaces set data = json_set(data, '$.celebrated', json('true')) where student_id = ?`, [id]);

	await page.goto('/m/radio');
	await run(page, 'print(2)');
	await expect.poll(async () => (await q(`select json_extract(data, '$.celebrated') c from workspaces where student_id = ?`, [id]))[0].c).toBe('["intro"]');
});
