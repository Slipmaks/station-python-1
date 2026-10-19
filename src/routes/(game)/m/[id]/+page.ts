import { redirect } from '@sveltejs/kit';
import { lessonOf } from '#lib/lessons/index.js';
import { isOpen, isUnlocked } from '#lib/state.svelte.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	await parent(); // стан гри відновлюється в (game)/+layout.ts — без цього при перезавантаженні сторінки відсік здавався б закритим
	const lesson = lessonOf(params.id);
	if (!lesson || !isOpen(lesson)) redirect(307, '/');
	const i = lesson.missions.findIndex(m => m.id === params.id);
	if (!isUnlocked(lesson, i)) redirect(307, '/l/' + lesson.id);
	return { lesson, i };
};
