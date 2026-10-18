import { MISSIONS } from './lessons/index.js';
import type { Mission, Prog, Workspace } from './types.js';
import { send } from './sync.svelte.js';

/* Стан гри в браузері. Група (game) працює без SSR, тож модуль належить одному учневі у вкладці. */

export type GameData = {
	student: { id: number; name: string; className: string };
	unlockAll: boolean;
	done: Record<string, { stars: number }>;
	workspace: Workspace | null;
};

const emptyWorkspace = (): Workspace => ({ code: {}, prog: {}, step: {}, celebrated: false });
export const S = $state({ name: '', className: '', unlockAll: false, done: {} as Record<string, { stars: number }>, ...emptyWorkspace() });

let hydratedFor: number | null = null;
/** Стан з даних сервера — один раз на учня: повторні load (напр. refreshAll) не мають затирати ще не збережені зміни. */
export function hydrate(d: GameData) {
	if (hydratedFor === d.student.id) return;
	hydratedFor = d.student.id;
	Object.assign(S, { name: d.student.name, className: d.student.className, unlockAll: d.unlockAll, done: d.done }, emptyWorkspace(), d.workspace);
}

/* ---------- збереження на сервер ---------- */
let saveTimer: ReturnType<typeof setTimeout> | undefined;
/** Чернетки й лічильники — не частіше ніж раз на секунду. */
export function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 1000); }
export function saveNow() {
	clearTimeout(saveTimer);
	saveTimer = undefined;
	const { code, prog, step, celebrated } = $state.snapshot(S);
	send({ url: '/api/workspace', method: 'PUT', body: { code, prog, step, celebrated }, key: 'workspace' });
}
export const savePending = () => saveTimer !== undefined;

export function logAttempt(a: { missionId: string; step: number; answer: string; passed: boolean; hints: number }) {
	send({ url: '/api/attempt', method: 'POST', body: a });
}

export const doneCount = () => MISSIONS.filter(m => S.done[m.id]).length;
export const starsTotal = () => MISSIONS.reduce((a, m) => a + (S.done[m.id]?.stars ?? 0), 0);
export const isUnlocked = (i: number) => S.unlockAll || i === 0 || !!S.done[MISSIONS[i - 1].id] || !!S.done[MISSIONS[i].id];
export const nextIndex = () => MISSIONS.findIndex(m => !S.done[m.id]);

/** Лічильники підказок і помилок у відсіку (по кроках). Повертає реактивний проксі, а не вихідний об’єкт. */
export function prog(m: Mission): Prog {
	const n = 'steps' in m ? m.steps.length : 1;
	S.prog[m.id] ??= { hints: [], fails: [], sol: false, mistakes: 0 };
	const p = S.prog[m.id];
	// якщо у відсік додали кроки, масиви зі старого збереження коротші
	for (const a of [p.hints, p.fails]) while (a.length < n) a.push(0);
	return p;
}

/* ---------- модальні вікна й повідомлення ---------- */
export type Modal = { kind: 'complete'; i: number; stars: number } | { kind: 'cert' } | null;
export const ui = $state({ modal: null as Modal, toast: '' });
/** Відсік, який щойно ввімкнувся: головний екран один раз програє анімацію. Навмисно не реактивне. */
export const flash = { justLit: null as string | null };

let toastTimer: ReturnType<typeof setTimeout>;
export function toast(msg: string) { ui.toast = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => (ui.toast = ''), 3800); }

export function complete(i: number, stars: number) {
	const m = MISSIONS[i];
	const prev = S.done[m.id];
	S.done[m.id] = { stars: Math.max(stars, prev?.stars ?? 0) };
	delete S.prog[m.id];
	if ('steps' in m) S.step[m.id] = 0;
	if (!prev) flash.justLit = m.id;
	send({ url: '/api/complete', method: 'POST', body: { missionId: m.id, stars } });
	saveNow();
	ui.modal = { kind: 'complete', i, stars };
}
