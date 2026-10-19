import { describe, expect, it } from 'vitest';
import { Py } from '../py.js';
import { choiceStars, codeStars, grade, resolveTask, typesStars } from '../grade.js';
import { LESSONS, findMission } from './index.js';

// Страховка для нових уроків: еталонний розв’язок проходить перевірки, стартовий код — ні,
// а відповіді «Що виведе програма?» й сканера типів збігаються з тим, що справді виводить інтерпретатор.
it('id відсіків унікальні серед усіх уроків (це ключ у БД)', () => {
	const ids = LESSONS.flatMap(l => l.missions.map(m => m.id));
	expect(new Set(ids).size).toBe(ids.length);
});

for (const lesson of LESSONS) {
	describe(`урок «${lesson.title}»`, () => {
		it('звання сертифіката — від найвищого, останнє з порогом 0', () => {
			const from = lesson.certificate.ranks.map(r => r.from);
			expect(from).toEqual([...from].sort((a, b) => b - a));
			expect(from.at(-1)).toBe(0);
		});

		for (const m of lesson.missions) {
			if (m.kind === 'code') {
				const steps = 'steps' in m ? m.steps.length : 1;
				for (let s = 0; s < steps; s++) {
					const t = resolveTask(m, s);
					it(`${m.id}${steps > 1 ? ` крок ${s + 1}` : ''}: розв’язок проходить, стартовий код — ні`, () => {
						expect(grade(t, t.solution).verdict).toEqual({ kind: 'good' });
						expect(grade(t, t.starter).ok).toBe(false);
					});
				}
			}
			if (m.kind === 'choice') {
				it(`${m.id}: правильні відповіді збігаються з виводом Python`, () => {
					for (const item of m.items) {
						expect(item.answer).toBeLessThan(item.options.length);
						expect(new Set(item.options).size).toBe(item.options.length); // сервер звіряє відповідь за текстом
						if (item.code) expect(Py.outputText(Py.run(item.code)).trimEnd()).toBe(item.options[item.answer]);
					}
				});
			}
			if (m.kind === 'types') {
				it(`${m.id}: type() збігається з відповідями, пул достатній`, () => {
					expect(m.pool.length).toBeGreaterThanOrEqual(m.count);
					expect(m.pass).toBeLessThanOrEqual(m.count);
					expect(new Set(m.pool.map(([v]) => v)).size).toBe(m.pool.length); // сервер шукає значення в пулі
					for (const [v, t] of m.pool) expect(Py.outputText(Py.run(`print(type(${v}))`)).trim()).toBe(`<class '${t}'>`);
				});
			}
		}
	});
}

it('жорстко вписане значення не проходить тести з іншими даними', () => {
	const airlock = findMission('airlock');
	if (airlock?.kind !== 'code') throw new Error('немає відсіку airlock');
	const g = grade(resolveTask(airlock, 0), "input('Як тебе звати? ')\nprint('Привіт, Марко')");
	expect(g.verdict).toEqual({ kind: 'hardcoded', first: 'Марко', failed: 'Оля' });
});

describe('зірки — як в офлайн-версії', () => {
	const p = (hints: number[], fails: number[], sol = false) => ({ hints, fails, sol });
	it('задача з кодом', () => {
		expect(codeStars(p([0], [0]), false)).toBe(3);
		expect(codeStars(p([1], [0]), false)).toBe(2);
		expect(codeStars(p([0], [3]), false)).toBe(3);
		expect(codeStars(p([0], [4]), false)).toBe(2);
		expect(codeStars(p([2], [9]), false)).toBe(1);
		expect(codeStars(p([0], [0], true), false)).toBe(1);
	});
	it('ремонтний відсік: помилки сумуються по кроках, поріг — 6', () => {
		expect(codeStars(p([0, 0, 0, 0], [2, 1, 1, 1]), true)).toBe(3);
		expect(codeStars(p([0, 0, 0, 0], [2, 2, 1, 1]), true)).toBe(2);
		expect(codeStars(p([0, 0, 1, 0], [0, 0, 0, 0]), true)).toBe(2);
	});
	it('вікторина й сканер', () => {
		expect([0, 1, 2, 3].map(choiceStars)).toEqual([3, 2, 2, 1]);
		expect([10, 9, 8].map(r => typesStars(r, 10))).toEqual([3, 2, 1]);
	});
});
