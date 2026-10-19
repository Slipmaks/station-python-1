import type { Page } from '@playwright/test';
import { resolveTask } from '../src/lib/grade.js';
import { LESSONS, lessonNo } from '../src/lib/lessons/index.js';
import type { Mission } from '../src/lib/types.js';
import { expect, makeClass, modalStars, q, register, run, stars, test } from './helpers.js';

/* Кожен відсік кожного готового уроку проходиться в браузері правильними відповідями на ★★★.
   Страховка для нових і змінених уроків; логіку вмісту перевіряє ще й src/lib/lessons/lessons.spec.ts. */

/** Пройти відсік, як це зробив би учень, що знає всі відповіді. */
async function solve(page: Page, m: Mission) {
	await page.goto('/m/' + m.id);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(m.name);
	if (m.kind === 'code') {
		const n = 'steps' in m ? m.steps.length : 1;
		for (let s = 0; s < n; s++) {
			await run(page, resolveTask(m, s).solution);
			if (s < n - 1) await expect(page.locator('.brief h3').first(), 'наступна програма').toHaveText(`Програма ${s + 2} з ${n}`);
		}
	} else if (m.kind === 'choice') {
		await expect(page.locator('.opt').first()).toBeVisible();
		for (const [k, it] of m.items.entries()) {
			// варіанти перемішано — шукаємо правильний за текстом
			const texts = await page.locator('.opt > span:last-child').allTextContents();
			await page.locator('.opt').nth(texts.indexOf(it.options[it.answer])).click();
			await page.locator('.qnext .btn').click();
			if (k < m.items.length - 1) await expect(page.locator('.qnext .btn'), 'наступне запитання').toBeHidden();
		}
	} else {
		const pool = Object.fromEntries(m.pool);
		for (let k = 0; k < m.count; k++) {
			const value = (await page.locator('.scan-value span').textContent())!;
			await page.locator('.tbtn b').getByText(pool[value], { exact: true }).click();
			await page.locator('.qnext .btn').click();
			if (k < m.count - 1) await expect(page.locator('.qnext .btn'), 'наступний контейнер').toBeHidden();
		}
	}
	expect(await modalStars(page), 'зірки у вікні').toBe(3);
}

for (const lesson of LESSONS.filter(l => l.missions.length)) {
	test(`урок ${lessonNo(lesson)} «${lesson.title}»: усі відсіки проходяться на ★★★`, async ({ page }) => {
		const cls = await makeClass('Вміст', { unlockAll: true });
		await q('update classes set open_lessons = ? where id = ?', [JSON.stringify([lesson.id]), cls.id]);
		const id = await register(page, cls.code, 'Відмінник');

		for (const m of lesson.missions) await test.step(`${m.id} «${m.name}»`, () => solve(page, m));
		await expect.poll(() => stars(id), 'зірки, які записав сервер').toEqual(Object.fromEntries(lesson.missions.map(m => [m.id, 3])));

		await page.goto('/l/' + lesson.id);
		await expect(page.locator('.pt-long')).toHaveText(`Відновлено ${lesson.missions.length} з ${lesson.missions.length}`);
		await expect(page.locator('.cert'), 'сертифікат уроку').toContainText(`Урок ${lessonNo(lesson)} «${lesson.title}»`);
	});
}
