import type { PyErr, PyEvent } from './py.js';
export function esc(s: unknown): string;
export function highlight(src: string): string;
export function explainError(e: PyErr | null, events?: PyEvent[], src?: string): string;
