import { Py, type RunResult } from './py.js';
import { norm, outIs } from './checks.js';
import type { CodeMission, CodeTask } from './types.js';

/** Завдання поточного кроку: для «ремонтного» відсіку крок перетворюється на звичайне завдання. */
export function resolveTask(m: CodeMission, stepIdx: number): CodeTask {
	if (!('steps' in m)) return m;
	const s = m.steps[stepIdx];
	return {
		...s,
		checks: [
			{ label: 'Програма працює без помилок', fn: c => !c.res.error },
			{ label: 'Результат правильний', fn: outIs(s.expected), diff: s.expected }
		],
		hints: [s.hint]
	};
}

function evalChecks(t: CodeTask, src: string, res: RunResult, inputs: string[]) {
	const ctx = { src, res, out: norm(Py.outputText(res)), inputs };
	return t.checks.map(x => { try { return !!x.fn(ctx); } catch { return false; } });
}

export type Verdict =
	| { kind: 'good' }
	| { kind: 'hardcoded'; first: string; failed: string }
	| { kind: 'error' }
	| { kind: 'diff'; expected: string; got: string }
	| { kind: 'incomplete' };

/**
 * Запускає код учня на всіх тестових даних і повертає стан кожної перевірки.
 * Чиста функція без DOM — її можна викликати і в браузері, і на сервері.
 */
export function grade(t: CodeTask, src: string) {
	const tests = t.tests || [{ inputs: [] }];
	const res = Py.run(src, { inputs: tests[0].inputs });
	const st: (boolean | null)[] = evalChecks(t, src, res, tests[0].inputs);
	let ok = st.every(Boolean) && !res.needInput && !res.error;
	let verdict: Verdict | null = null;
	if (tests.length > 1) {
		let otherOk: boolean | null = null;
		if (ok) {
			otherOk = true;
			for (const other of tests.slice(1)) {
				const r = Py.run(src, { inputs: other.inputs });
				if (r.error || r.needInput || !evalChecks(t, src, r, other.inputs).every(Boolean)) {
					otherOk = false;
					verdict = { kind: 'hardcoded', first: tests[0].inputs[0], failed: other.inputs[0] };
					break;
				}
			}
		}
		st.push(otherOk);
		ok = ok && otherOk === true;
	}
	if (ok) verdict = { kind: 'good' };
	else if (!verdict) {
		const diffCheck = t.checks.findIndex((x, k) => x.diff && !st[k]);
		if (res.error) verdict = { kind: 'error' };
		else if (diffCheck >= 0 && st.slice(0, t.checks.length).filter(v => !v).length === 1)
			verdict = { kind: 'diff', expected: t.checks[diffCheck].diff!, got: norm(Py.outputText(res)) };
		else verdict = { kind: 'incomplete' };
	}
	return { res, st, ok, verdict, inputsCount: tests[0].inputs.length };
}

/* ---------- зірки за відсік: ★★★ — бездоганно, ★ — мінімум за пройдений відсік ---------- */

/** Задача з кодом: −1 за підказки, −1 за багато невдалих запусків і ще −1 за перебір навмання; показаний розв’язок — лише ★. */
export function codeStars(p: { hints: number[]; fails: number[]; sol: boolean }, multiStep: boolean) {
	if (p.sol) return 1;
	const fails = p.fails.reduce((a, b) => a + (b || 0), 0);
	const [many, guessing] = multiStep ? [6, 15] : [4, 10];
	return Math.max(1, 3 - (p.hints.some(Boolean) ? 1 : 0) - (fails >= many ? 1 : 0) - (fails >= guessing ? 1 : 0));
}
export const choiceStars = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
/** Сканер типів: помилки за все проходження разом із невдалими прогонами — інакше його перепроходять, доки не вгадають. */
export const typesStars = (mistakes: number) => (mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1);
