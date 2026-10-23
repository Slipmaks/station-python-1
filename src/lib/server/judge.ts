import { choiceStars, codeStars, grade, resolveTask, typesStars } from '../grade.js';
import type { Mission } from '../types.js';

/* Сервер сам вирішує, чи правильна відповідь і чи пройдено відсік, — за тими ж правилами, що й гра в браузері. */

/** Чи правильна відповідь; null — такого кроку чи значення у відсіку немає. */
export function check(m: Mission, step: number, answer: string): boolean | null {
	if (m.kind === 'code') return step < ('steps' in m ? m.steps.length : 1) ? grade(resolveTask(m, step), answer).ok : null;
	if (m.kind === 'choice') {
		const it = m.items[step];
		return it ? answer === it.options[it.answer] : null;
	}
	// сканер надсилає «значення → тип»
	const [val, t] = answer.split(' → ');
	const e = m.pool.find(([v]) => v === val);
	return step < m.count && e ? e[1] === t : null;
}

export type Row = { step: number; passed: boolean; hints: number; sol: boolean };

/**
 * Зірки, якщо спроби від минулого проходження (остання — щойно надіслана) завершують відсік; інакше null.
 * ponytail: підказки й показаний розв’язок повідомляє браузер — сервер їх не бачить; підробка дасть ★★★ замість ★★, але лише за справжній розв’язок.
 */
export function result(m: Mission, rows: Row[]): number | null {
	if (m.kind === 'types') {
		// сканер: останні count відповідей — один повний прохід 0…count−1
		const run = rows.slice(-m.count);
		if (run.length < m.count || run.some((r, k) => r.step !== k)) return null;
		return run.filter(r => r.passed).length >= m.pass ? typesStars(rows.filter(r => !r.passed).length) : null;
	}
	const n = m.kind === 'choice' ? m.items.length : 'steps' in m ? m.steps.length : 1;
	const last = rows.at(-1);
	if (!last?.passed || last.step !== n - 1) return null;
	// кожен крок має бути пройдений у цьому проходженні
	if (new Set(rows.filter(r => r.passed).map(r => r.step)).size < n) return null;
	const fails = rows.filter(r => !r.passed).length;
	if (m.kind === 'choice') return choiceStars(fails);
	return codeStars({ hints: rows.map(r => r.hints), fails: [fails], sol: rows.some(r => r.sol) }, n > 1);
}
