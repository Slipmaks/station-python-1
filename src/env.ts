import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Адреса БД: file:local.db локально або libsql://….turso.io у продакшні.' },
	DATABASE_AUTH_TOKEN: {
		description: 'Токен Turso; для локального файлу не потрібен.',
		schema: v => v || undefined
	},
	DEMO_CLASS_CODE: {
		description: 'Код класу для демо-входу /demo (гості з портфоліо). Немає — /demo відповідає 404.',
		schema: v => v || undefined
	}
});
