import { hydrate } from '#lib/state.svelte.js';
import type { LayoutLoad } from './$types';

// Гра працює лише в браузері: стан гри — модуль на клієнті (на сервері він був би спільним для всіх учнів).
export const ssr = false;

export const load: LayoutLoad = ({ data }) => {
	hydrate(data);
	return data;
};
