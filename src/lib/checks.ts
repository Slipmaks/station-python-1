import type { CheckCtx } from './types.js';

/** Прибирає \r, пробіли в кінці рядків і порожні рядки в кінці виводу. */
export const norm = (s: string) => s.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
export const outIs = (exp: string) => (ctx: CheckCtx) => ctx.out === exp;
export const lastLine = (ctx: CheckCtx) => { const ls = ctx.out.split('\n').filter(l => l.trim()); return ls.length ? ls[ls.length - 1].trim() : ''; };
/** Скільки разів у коді (поза рядками й коментарями) викликано функцію word(). */
export const count = (src: string, word: string) => (stripStrings(src).match(new RegExp('\\b' + word + '\\s*\\(', 'g')) || []).length;
export function stripStrings(src: string) { return src.replace(/#.*$/gm, '').replace(/'[^'\n]*'|"[^"\n]*"/g, "''"); }
/** Як Python виводить дробове число: 9 → 9.0, 8.1 → 8.1. */
export const pyFloat = (x: number) => (Number.isInteger(x) ? x + '.0' : String(x));
/** Числа з рядка введення. */
export const nums = (s: string) => s.trim().split(/\s+/).map(Number);
/** Останні n непорожніх рядків виводу. */
export const tail = (c: CheckCtx, n: number) => c.out.split('\n').map(l => l.trim()).filter(Boolean).slice(-n).join('\n');
