import { redirect } from '@sveltejs/kit';
import { findLesson } from '#lib/lessons/index.js';
import { isOpen } from '#lib/state.svelte.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	await parent(); // стан гри відновлюється в (game)/+layout.ts
	const lesson = findLesson(params.lesson);
	if (!lesson || !isOpen(lesson)) redirect(307, '/');
	return { lesson };
};
