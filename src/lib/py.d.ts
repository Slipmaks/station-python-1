export type Seg = { text: string; kind: 'out' | 'in' };
export type PyErr = { type: string; msg: string; line: number; code: string };
export type PyEvent = { type: 'shadow' | 'zen' | 'antigravity'; name?: string; line?: number };
export type RunResult = {
	out: Seg[];
	env: Record<string, unknown>;
	events: PyEvent[];
	error: PyErr | null;
	needInput: boolean;
};
export type RunOpts = { inputs?: string[]; env?: Record<string, unknown>; repl?: boolean; maxSteps?: number };

export const Py: {
	run(src: string, opts?: RunOpts): RunResult;
	formatError(e: PyErr | null): string;
	outputText(res: RunResult): string;
	repr(v: unknown): string;
	str(v: unknown): string;
	typeName(v: unknown): string;
};
