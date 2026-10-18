import type { RunResult } from './py.js';

/** Що бачить функція перевірки: код учня, результат запуску, нормалізований вивід і введені дані. */
export type CheckCtx = { src: string; res: RunResult; out: string; inputs: string[] };
export type Check = { label: string; fn: (c: CheckCtx) => boolean; diff?: string };

/** Очікуваний результат: рядок або послідовність [текст, 'out' | 'in'] для діалогу з input(). */
export type Expected = string | [string, 'out' | 'in'][];

/** Одне завдання з кодом, уже готове до перевірки. */
export type CodeTask = {
	task: string;
	expected: Expected;
	starter: string;
	checks: Check[];
	hints: string[];
	solution: string;
	tests?: { inputs: string[] }[];
	inputsNote?: string;
	otherDataLabel?: string;
};

/** Крок «ремонтного» відсіку: кілька зламаних програм поспіль. */
export type RepairStep = { task: string; expected: string; starter: string; hint: string; solution: string };

type Base = { id: string; name: string; topic: string; slide: string; story: string; learned: string };

export type CodeMission = Base & { kind: 'code' } & (CodeTask | { steps: RepairStep[] });
export type ChoiceItem = { q?: string; code?: string; options: string[]; answer: number; explain: string; codeOpts?: boolean };
export type ChoiceMission = Base & { kind: 'choice'; items: ChoiceItem[] };
export type TypeKey = 'int' | 'float' | 'str' | 'bool';
/** Сканер типів: `count` випадкових значень із `pool` ([як записано в коді, тип]), для проходження — щонайменше `pass`. */
export type TypesMission = Base & { kind: 'types'; task: string; pool: [string, TypeKey][]; count: number; pass: number };
export type Mission = CodeMission | ChoiceMission | TypesMission;

export type Lesson = {
	id: string;
	title: string;
	/** Відсіки відкриваються в порядку масиву. id відсіків унікальні серед усіх уроків — це ключ у БД. */
	missions: Mission[];
	/** Приклади для пісочниці: [назва, код]. */
	examples: [string, string][];
	certificate: {
		/** Звання від найвищого: `from` — частка зібраних зірок (0…1). */
		ranks: { from: number; title: string }[];
		summary: string;
		next: string;
	};
};

/** Лічильники в межах відсіку; hints і fails — по кроках (у звичайному відсіку крок один). */
export type Prog = { hints: number[]; fails: number[]; sol: boolean; mistakes: number };
/** Робочий стан гри учня, що зберігається в БД одним JSON. */
export type Workspace = { code: Record<string, string>; prog: Record<string, Prog>; step: Record<string, number>; celebrated: boolean };
