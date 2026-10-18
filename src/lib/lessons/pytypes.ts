import type { TypeKey } from '../types.js';

/** Пояснення до типів Python для сканера типів — спільні для всіх уроків. */
export const TYPE_INFO: Record<TypeKey, { sub: string; why: string }> = {
  int: { sub: 'ціле число', why: 'Ціле число без крапки й без лапок — це int.' },
  float: { sub: 'дробове', why: 'Є крапка — отже, це дробове число float. Навіть 2.0!' },
  str: { sub: 'рядок', why: 'Значення в лапках — це рядок str, навіть якщо всередині число чи True.' },
  bool: { sub: 'логічне', why: 'True і False (з великої літери й без лапок) — логічні значення bool.' },
};
