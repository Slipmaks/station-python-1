import { describe, expect, it } from 'vitest';
import { PIN_LOCK_MS, PIN_TRIES, afterWrongPin, cleanCode, hashSecret, isPin, nameKey, newClassCode, verifySecret } from './secrets.js';
import { parseAttempt, parseWorkspace } from './api.js';
import { check, result } from './judge.js';
import { STUCK_FAILS, buildReport } from './report.js';
import { ago } from '../time.js';
import { resolveTask } from '../grade.js';
import { findMission } from '../lessons/index.js';
import type { Mission } from '../types.js';

describe('секрети', () => {
	it('PIN перевіряється лише правильний, а хеш щоразу інший (сіль)', async () => {
		const h = await hashSecret('1234');
		expect(await verifySecret('1234', h)).toBe(true);
		expect(await verifySecret('1235', h)).toBe(false);
		expect(await hashSecret('1234')).not.toBe(h);
	});
	it('після 5 помилок поспіль — блокування на 10 хвилин і новий відлік', () => {
		let s = { failedPins: 0, lockedUntil: null as Date | null };
		for (let k = 1; k < PIN_TRIES; k++) {
			s = afterWrongPin(s.failedPins, 0);
			expect(s).toEqual({ failedPins: k, lockedUntil: null });
		}
		expect(afterWrongPin(s.failedPins, 1000)).toEqual({ failedPins: 0, lockedUntil: new Date(1000 + PIN_LOCK_MS) });
	});
	it('PIN — рівно 4 цифри', () => {
		expect(['1234', '0000'].every(isPin)).toBe(true);
		expect(['123', '12345', '12a4', ' 1234'].some(isPin)).toBe(false);
	});
	it('однакові імена з різним регістром, пробілами й апострофами — один ключ', () => {
		expect(nameKey('  Мар’яна   К. ')).toBe(nameKey("мар'яна к."));
		expect(nameKey('Марʼяна К.')).toBe(nameKey("мар'яна к."));
		expect(nameKey('Оля')).not.toBe(nameKey('Олег'));
	});
	it('код класу: 6 символів без схожих 0/O/1/I; введення нормалізується', () => {
		for (let k = 0; k < 50; k++) expect(newClassCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
		expect(cleanCode(' ab-c 12x ')).toBe('ABC12X');
	});
});

describe('перевірка даних від браузера', () => {
	const ws = { code: { radio: "print('Hi')" }, prog: { radio: { hints: [1], fails: [0], sol: false, mistakes: 0 } }, step: { repair: 2 }, celebrated: false };
	it('робочий стан', () => {
		expect(parseWorkspace(ws)).toEqual(ws);
		expect(parseWorkspace({ ...ws, celebrated: 'так' })).toBeNull();
		expect(parseWorkspace({ ...ws, code: { radio: 5 } })).toBeNull();
		expect(parseWorkspace({ ...ws, prog: { radio: { hints: [-1], fails: [], sol: false, mistakes: 0 } } })).toBeNull();
		expect(parseWorkspace([])).toBeNull();
	});
	it('спроба: лише відомий відсік і розумні межі; «пройдено» від браузера не береться', () => {
		const a = { missionId: 'radio', step: 0, answer: "print('Hi')", hints: 1, sol: true };
		expect(parseAttempt(a)).toEqual(a);
		expect(parseAttempt({ ...a, passed: true })).toEqual(a);
		expect(parseAttempt({ missionId: 'archive', step: 0, answer: 'Інтерпретатор' })).toEqual({ missionId: 'archive', step: 0, answer: 'Інтерпретатор', hints: 0, sol: false });
		expect(parseAttempt({ ...a, missionId: 'nope' })).toBeNull();
		expect(parseAttempt({ ...a, answer: 'x'.repeat(20_001) })).toBeNull();
		expect(parseAttempt({ ...a, step: 1.5 })).toBeNull();
		expect(parseAttempt({ ...a, sol: 'так' })).toBeNull();
	});
});

function mission<K extends Mission['kind']>(id: string, kind: K) {
	const m = findMission(id);
	if (m?.kind !== kind) throw new Error(`немає відсіку ${id}`);
	return m as Extract<Mission, { kind: K }>;
}

describe('сервер сам перевіряє відповіді й рахує зірки', () => {
	const radio = mission('radio', 'code'), repair = mission('repair', 'code');
	const archive = mission('archive', 'choice'), scanner = mission('scanner', 'types');
	const row = (step: number, passed: boolean, hints = 0, sol = false) => ({ step, passed, hints, sol });

	it('відповідь: код запускається, вікторина й сканер звіряються з уроком', () => {
		const t = resolveTask(radio, 0);
		expect([check(radio, 0, t.solution), check(radio, 0, t.starter), check(radio, 1, t.solution)]).toEqual([true, false, null]);
		const q = archive.items[0];
		expect(check(archive, 0, q.options[q.answer])).toBe(true);
		expect(check(archive, 0, q.options[(q.answer + 1) % q.options.length])).toBe(false);
		expect(check(archive, archive.items.length, q.options[q.answer])).toBeNull();
		const [v, type] = scanner.pool[0];
		expect(check(scanner, 0, `${v} → ${type}`)).toBe(true);
		expect(check(scanner, 0, `${v} → ${type === 'int' ? 'str' : 'int'}`)).toBe(false);
		expect(check(scanner, 0, '123456 → int')).toBeNull();
		expect(check(scanner, scanner.count, `${v} → ${type}`)).toBeNull();
	});
	it('задача з кодом: ті самі зірки, що й у браузері', () => {
		expect(result(radio, [row(0, true)])).toBe(3);
		expect(result(radio, [...Array(3).fill(row(0, false)), row(0, true)])).toBe(3);
		expect(result(radio, [...Array(4).fill(row(0, false)), row(0, true)])).toBe(2);
		expect(result(radio, [row(0, false, 1), row(0, true, 1)])).toBe(2);
		expect(result(radio, [row(0, false, 0, true), row(0, true, 0, true)])).toBe(1);
		expect(result(radio, [row(0, false)])).toBeNull();
	});
	it('ремонтний відсік: потрібні всі програми цього проходження', () => {
		const n = 'steps' in repair ? repair.steps.length : 1;
		const all = Array.from({ length: n }, (_, s) => row(s, true));
		expect(n).toBeGreaterThan(1);
		expect(result(repair, all)).toBe(3);
		expect(result(repair, [row(0, false), row(0, false), ...all, ...Array(4).fill(row(n - 1, false)), row(n - 1, true)])).toBe(2);
		expect(result(repair, [row(n - 1, true)])).toBeNull();
		expect(result(repair, all.slice(0, -1))).toBeNull();
	});
	it('вікторина: кожна помилка рахується; останнє запитання без попередніх — не проходження', () => {
		const all = archive.items.map((_, k) => row(k, true));
		expect(result(archive, all)).toBe(3);
		expect(result(archive, [row(0, false), row(0, false), ...all])).toBe(2);
		expect(result(archive, [row(0, false), row(1, false), row(2, false), ...all])).toBe(1);
		expect(result(archive, all.slice(-1))).toBeNull();
		expect(result(archive, [...all, row(all.length - 1, false)])).toBeNull();
	});
	it('сканер: останній повний прохід, щонайменше pass правильних', () => {
		const run = (right: number) => Array.from({ length: scanner.count }, (_, k) => row(k, k < right));
		expect([10, 9, 8, 7].map(r => result(scanner, run(r)))).toEqual([3, 2, 1, null]);
		expect(result(scanner, [...run(3).slice(0, 4), ...run(10)])).toBe(3);
		expect(result(scanner, run(10).slice(1))).toBeNull();
		expect(result(scanner, Array(scanner.count).fill(row(0, true)))).toBeNull();
	});
});

describe('таблиця результатів класу', () => {
	const now = new Date(10_000_000);
	const t = (min: number) => new Date(now.getTime() - min * 60_000);
	const r = buildReport(
		['radio', 'archive', 'power'],
		[
			{ id: 1, name: 'Оля', lockedUntil: null },
			{ id: 2, name: 'Петро', lockedUntil: new Date(now.getTime() + 60_000) },
			{ id: 3, name: 'Ігор', lockedUntil: t(1) }
		],
		[
			{ studentId: 1, missionId: 'radio', stars: 3 },
			{ studentId: 1, missionId: 'archive', stars: 1 },
			{ studentId: 2, missionId: 'radio', stars: 2 }
		],
		[
			{ studentId: 1, missionId: 'radio', attempts: 2, fails: 1, hints: 0, last: t(30) },
			{ studentId: 1, missionId: 'archive', attempts: 9, fails: 4, hints: 0, last: t(5) },
			{ studentId: 2, missionId: 'power', attempts: STUCK_FAILS, fails: STUCK_FAILS, hints: 2, last: t(2) },
			{ studentId: 2, missionId: 'radio', attempts: 1, fails: 0, hints: 1, last: t(40) }
		],
		now
	);
	it('клітинки: пройдено, застряг, не починав', () => {
		const [olya, petro, ihor] = r.rows;
		expect(olya.cells.map(c => c?.stars ?? null)).toEqual([3, 1, null]);
		expect(petro.cells[2]).toEqual({ stars: 0, attempts: STUCK_FAILS, fails: STUCK_FAILS, hints: 2, stuck: true });
		expect(petro.cells[0]?.stuck).toBe(false);
		expect(ihor.cells).toEqual([null, null, null]);
	});
	it('підсумки рядка й колонок', () => {
		expect(r.rows.map(x => [x.done, x.stars])).toEqual([[2, 4], [1, 2], [0, 0]]);
		expect(r.totals).toEqual([2, 1, 0]);
	});
	it('остання активність і блокування лише чинне', () => {
		expect(r.rows.map(x => x.last?.getTime() ?? null)).toEqual([t(5).getTime(), t(2).getTime(), null]);
		expect(r.rows.map(x => x.locked)).toEqual([false, true, false]);
	});
	it('«N хв тому»', () => {
		expect([ago(null, now), ago(t(0.5), now), ago(t(5), now), ago(t(125), now), ago(t(3000), now)]).toEqual(['—', 'щойно', '5 хв тому', '2 год тому', '2 дн тому']);
	});
});
