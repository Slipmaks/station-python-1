import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Лише для сторінок; дії форм (actions) перевіряють доступ самі — див. #lib/server/teacher.ts
export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.teacher) redirect(303, '/teacher/login');
	return { teacher: locals.teacher };
};
