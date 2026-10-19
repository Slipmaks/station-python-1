import { describe, expect, it } from 'vitest';
import { PIN_LOCK_MS, PIN_TRIES, afterWrongPin, cleanCode, hashSecret, isPin, nameKey, newClassCode, verifySecret } from './secrets.js';
import { parseAttempt, parseCompletion, parseWorkspace } from './api.js';
import { STUCK_FAILS, buildReport } from './report.js';
import { ago } from '../time.js';

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
	it('спроба: лише відомий відсік і розумні межі', () => {
		const a = { missionId: 'radio', step: 0, answer: "print('Hi')", passed: false, hints: 1 };
		expect(parseAttempt(a)).toEqual(a);
		expect(parseAttempt({ ...a, missionId: 'nope' })).toBeNull();
		expect(parseAttempt({ ...a, answer: 'x'.repeat(20_001) })).toBeNull();
		expect(parseAttempt({ ...a, step: 1.5 })).toBeNull();
	});
	it('проходження: зірки 1–3', () => {
		expect(parseCompletion({ missionId: 'radio', stars: 3 })).toEqual({ missionId: 'radio', stars: 3 });
		expect(parseCompletion({ missionId: 'radio', stars: 4 })).toBeNull();
		expect(parseCompletion({ missionId: 'radio', stars: 0 })).toBeNull();
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
