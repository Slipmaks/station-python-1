import { redirect } from '@sveltejs/kit';
import { MISSIONS } from '#lib/lessons/index.js';
import { isUnlocked } from '#lib/state.svelte.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	await parent(); // стан гри відновлюється в (game)/+layout.ts — без цього при перезавантаженні сторінки відсік здавався б закритим
	const i = MISSIONS.findIndex(m => m.id === params.id);
	if (i < 0 || !isUnlocked(i)) redirect(307, '/');
	return { i };
};
