import { describe, expect, it } from 'vitest';
import { Py } from '../py.js';
import { choiceStars, codeStars, grade, resolveTask, typesStars } from '../grade.js';
import { norm } from '../checks.js';
import type { Mission } from '../types.js';
import { LESSONS, findMission } from './index.js';

// Страховка для нових уроків: еталонний розв’язок проходить перевірки, стартовий код — ні,
// а відповіді «Що виведе програма?» й сканера типів збігаються з тим, що справді виводить інтерпретатор.
it('id відсіків унікальні серед усіх уроків (це ключ у БД)', () => {
	const ids = LESSONS.flatMap(l => l.missions.map(m => m.id));
	expect(new Set(ids).size).toBe(ids.length);
});

it('id уроків унікальні (це ключ у БД: відкриті вчителем уроки)', () => {
	const ids = LESSONS.map(l => l.id);
	expect(new Set(ids).size).toBe(ids.length);
});

it('id уроків і відсіків — малі латинські літери, цифри й дефіс (вони в адресі сторінки)', () => {
	for (const l of LESSONS) for (const id of [l.id, ...l.missions.map(m => m.id)]) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
});

it('назви відсіків не повторюються серед усіх уроків', () => {
	const names = LESSONS.flatMap(l => l.missions.map(m => m.name));
	expect(names.filter((n, k) => names.indexOf(n) !== k)).toEqual([]);
});

/** Тексти, що потрапляють на сторінку як HTML. */
const htmlTexts = (m: Mission) => [
	m.story,
	...(m.kind === 'types' ? [m.task] : m.kind === 'code' ? ('steps' in m ? m.steps.flatMap(s => [s.task, s.hint]) : [m.task, ...m.hints, m.inputsNote ?? '']) : [])
];
/** null — розмітка гаразд; інакше — що з нею не так. */
function badHtml(s: string) {
	const open: string[] = [];
	for (const [tag, close, name] of s.matchAll(/<(\/?)([a-zA-Z][^>\s]*)[^>]*>/g)) {
		if (!['b', 'i', 'code', 'br'].includes(name) || tag !== `<${close}${name}>`) return `тег ${tag} заборонено`;
		if (name === 'br') continue;
		if (!close) open.push(name);
		else if (open.pop() !== name) return `зайвий ${tag}`;
	}
	return open.length ? `не закрито <${open.at(-1)}>` : null;
}

// урок без відсіків ще готується — перевіряти нічого
for (const lesson of LESSONS.filter(l => l.missions.length)) {
	describe(`урок «${lesson.title}»`, () => {
		it('є сертифікат; звання — від найвищого, останнє з порогом 0', () => {
			const from = lesson.certificate!.ranks.map(r => r.from);
			expect(from).toEqual([...from].sort((a, b) => b - a));
			expect(from.at(-1)).toBe(0);
		});

		it('приклади для пісочниці запускаються без помилок', () => {
			for (const [name, code] of lesson.examples ?? []) expect(Py.run(code).error, name).toBeNull();
		});

		for (const m of lesson.missions)
			it(`${m.id}: у текстах лише <b>, <i>, <code>, <br>, і кожен тег закрито`, () => {
				for (const s of htmlTexts(m)) expect(badHtml(s), s).toBeNull();
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
				if (!('steps' in m)) {
					it(`${m.id}: «Очікуваний результат» — це вивід еталонного розв’язку`, () => {
						const out = norm(Py.outputText(Py.run(m.solution, { inputs: m.tests?.[0].inputs })));
						expect(out).toBe(typeof m.expected === 'string' ? m.expected : m.expected.map(([t]) => t).join(''));
					});
					it(`${m.id}: неправильні програми (wrong) перевірки відкидають`, () => {
						expect(m.wrong?.length, 'додай у відсік wrong — 1–3 неправильні програми').toBeGreaterThan(0);
						// програма з помилкою відпадає й так — вона нічого не перевіряє
						for (const w of m.wrong ?? []) expect(Py.run(w, { inputs: m.tests?.[0].inputs }).error, w).toBeNull();
						expect((m.wrong ?? []).filter(w => grade(m, w).ok), 'ці неправильні програми проходять перевірки').toEqual([]);
					});
					if (m.tests && m.tests.length > 1)
						it(`${m.id}: перевірка на інших даних має пояснення (inputsNote) і назву (otherDataLabel)`, () => {
							expect(m.inputsNote).toBeTruthy();
							expect(m.otherDataLabel).toBeTruthy();
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
