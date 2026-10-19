/** «щойно», «5 хв тому», «2 год тому», «3 дн тому». */
export function ago(d: Date | null, now: Date) {
	if (!d) return '—';
	const min = Math.floor((now.getTime() - d.getTime()) / 60_000);
	if (min < 1) return 'щойно';
	if (min < 60) return `${min} хв тому`;
	if (min < 24 * 60) return `${Math.floor(min / 60)} год тому`;
	return `${Math.floor(min / 1440)} дн тому`;
}
