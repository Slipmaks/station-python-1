import type { Handle } from '@sveltejs/kit/hooks';
import { readSession } from '#lib/server/session.js';

export const handle: Handle = async ({ event, resolve }) => {
	const s = await readSession(event.cookies);
	event.locals.student = s?.student ?? null;
	event.locals.teacher = s?.teacher ?? null;
	return resolve(event);
};
