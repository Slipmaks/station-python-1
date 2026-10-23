import type { Lesson, Mission, Prog, Workspace } from './types.js';
import { send } from './sync.svelte.js';

/* Стан гри в браузері. Група (game) працює без SSR, тож модуль належить одному учневі у вкладці. */

export type GameData = {
	student: { id: number; name: string; className: string };
	unlockAll: boolean;
	/** Уроки, які вчитель відкрив класу. */
	lessons: string[];
	done: Record<string, { stars: number }>;
	workspace: Workspace | null;
};

const emptyWorkspace = (): Workspace => ({ code: {}, prog: {}, step: {}, celebrated: [] });
export const S = $state({ name: '', className: '', unlockAll: false, lessons: [] as string[], done: {} as Record<string, { stars: number }>, ...emptyWorkspace() });

let hydratedFor: number | null = null;
/** Стан з даних сервера. Що відкрив учитель — щоразу (сторінка уроків оновлює дані сама),
 *  решту — один раз на учня: повторні load не мають затирати ще не збережені зміни. */
export function hydrate(d: GameData) {
	S.unlockAll = d.unlockAll;
	S.lessons = d.lessons;
	if (hydratedFor === d.student.id) return;
	hydratedFor = d.student.id;
	Object.assign(S, { name: d.student.name, className: d.student.className, done: d.done }, emptyWorkspace(), d.workspace);
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

/** Спроба йде на сервер; він сам перевіряє відповідь і записує пройдений відсік. */
export function logAttempt(a: { missionId: string; step: number; answer: string; hints?: number; sol?: boolean }) {
	send({ url: '/api/attempt', method: 'POST', body: a });
}

export const doneCount = (l: Lesson) => l.missions.filter(m => S.done[m.id]).length;
export const starsTotal = (l: Lesson) => l.missions.reduce((a, m) => a + (S.done[m.id]?.stars ?? 0), 0);
/** Урок можна відкрити: учитель відкрив його класу, і відсіки в ньому вже є. */
export const isOpen = (l: Lesson) => l.missions.length > 0 && S.lessons.includes(l.id);
/** Відсіки уроку відкриваються по черзі (або всі одразу, якщо так вирішив учитель). */
export const isUnlocked = (l: Lesson, i: number) => S.unlockAll || i === 0 || !!S.done[l.missions[i - 1].id] || !!S.done[l.missions[i].id];
export const nextIndex = (l: Lesson) => l.missions.findIndex(m => !S.done[m.id]);

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
/** kept — повторне проходження: зірки першого, які лишаються в заліку. */
export type Modal = { kind: 'complete'; id: string; stars: number; kept?: number } | { kind: 'cert'; lesson: string } | null;
export const ui = $state({ modal: null as Modal, toast: '' });
/** Відсік, який щойно ввімкнувся: головний екран один раз програє анімацію. Навмисно не реактивне. */
export const flash = { justLit: null as string | null };

let toastTimer: ReturnType<typeof setTimeout>;
export function toast(msg: string) { ui.toast = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => (ui.toast = ''), 3800); }

/** Показати проходження одразу; на сервері його вже записала остання спроба — за тими ж правилами зірок. */
export function complete(m: Mission, stars: number) {
	const prev = S.done[m.id];
	S.done[m.id] = prev ?? { stars };
	delete S.prog[m.id];
	if ('steps' in m) S.step[m.id] = 0;
	if (!prev) flash.justLit = m.id;
	saveNow();
	ui.modal = { kind: 'complete', id: m.id, stars, kept: prev?.stars };
}
