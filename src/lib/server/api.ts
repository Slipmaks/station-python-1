import { error } from '@sveltejs/kit';
import { findMission } from '../lessons/index.js';
import type { Workspace } from '../types.js';

/* Перевірка того, що надсилає браузер учня: дані з клієнта не довіряємо. */

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isInt = (x: unknown, min: number, max: number): x is number => Number.isInteger(x) && (x as number) >= min && (x as number) <= max;
const isCounts = (x: unknown) => Array.isArray(x) && x.length <= 50 && x.every(v => isInt(v, 0, 10_000));
const isMission = (x: unknown): x is string => typeof x === 'string' && !!findMission(x);

export function parseWorkspace(x: unknown): Workspace | null {
	if (!isObj(x) || !isObj(x.code) || !isObj(x.prog) || !isObj(x.step) || typeof x.celebrated !== 'boolean') return null;
	if (!Object.values(x.code).every(v => typeof v === 'string')) return null;
	if (!Object.values(x.step).every(v => isInt(v, 0, 50))) return null;
	const progOk = Object.values(x.prog).every(p => isObj(p) && isCounts(p.hints) && isCounts(p.fails) && typeof p.sol === 'boolean' && isInt(p.mistakes, 0, 10_000));
	if (!progOk) return null;
	return { code: x.code, prog: x.prog, step: x.step, celebrated: x.celebrated } as Workspace;
}

/** Спроба: «правильно чи ні» браузер не надсилає — це вирішує сервер. hints і sol — лише в задачах з кодом. */
export function parseAttempt(x: unknown) {
	if (!isObj(x) || !isMission(x.missionId) || !isInt(x.step, 0, 100) || typeof x.answer !== 'string' || x.answer.length > 20_000) return null;
	const { hints = 0, sol = false } = x;
	if (!isInt(hints, 0, 20) || typeof sol !== 'boolean') return null;
	return { missionId: x.missionId, step: x.step, answer: x.answer, hints, sol };
}

/** Тіло запиту як JSON, перевірене функцією parse; інакше — 400/413. */
export async function readBody<T>(request: Request, parse: (x: unknown) => T | null): Promise<T> {
	const text = await request.text();
	if (text.length > 200_000) error(413, 'Завеликий запит');
	let json: unknown;
	try { json = JSON.parse(text); } catch { error(400, 'Не JSON'); }
	const v = parse(json);
	if (v === null) error(400, 'Неправильні дані');
	return v;
}
