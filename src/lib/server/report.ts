/* Таблиця результатів класу «учні × відсіки» — чиста функція над рядками з БД. */

/** Скільки невдалих спроб без проходження — привід підійти до учня. */
export const STUCK_FAILS = 5;

export type Cell = { stars: number; attempts: number; fails: number; hints: number; stuck: boolean } | null;
type StudentRow = { id: number; name: string; lockedUntil: Date | null };
type ProgressRow = { studentId: number; missionId: string; stars: number };
type AttemptStat = { studentId: number; missionId: string; attempts: number; fails: number; hints: number; last: Date };

export function buildReport(missionIds: string[], students: StudentRow[], progress: ProgressRow[], stats: AttemptStat[], now: Date) {
	const key = (s: number, m: string) => `${s}:${m}`;
	const stars = new Map(progress.map(p => [key(p.studentId, p.missionId), p.stars]));
	const stat = new Map(stats.map(a => [key(a.studentId, a.missionId), a]));

	const rows = students.map(s => {
		const cells: Cell[] = missionIds.map(m => {
			const st = stars.get(key(s.id, m)) ?? 0;
			const a = stat.get(key(s.id, m));
			if (!st && !a) return null;
			const fails = a?.fails ?? 0;
			return { stars: st, attempts: a?.attempts ?? 0, fails, hints: a?.hints ?? 0, stuck: !st && fails >= STUCK_FAILS };
		});
		const lasts = stats.filter(a => a.studentId === s.id).map(a => a.last.getTime());
		return {
			id: s.id,
			name: s.name,
			locked: !!s.lockedUntil && s.lockedUntil > now,
			last: lasts.length ? new Date(Math.max(...lasts)) : null,
			done: cells.filter(c => c?.stars).length,
			stars: cells.reduce((a, c) => a + (c?.stars ?? 0), 0),
			cells
		};
	});
	/** Скільки учнів пройшли кожен відсік. */
	const totals = missionIds.map((_, k) => rows.filter(r => r.cells[k]?.stars).length);
	return { rows, totals };
}

