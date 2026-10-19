import { defineConfig } from '@playwright/test';

const PORT = 5199;

/* E2E: свіжа БД e2e.db, dev-сервер на окремому порту, установлений Google Chrome. Запуск: npm run test:e2e */
export default defineConfig({
	testDir: 'e2e',
	// тести ділять один сервер і одну БД; кожен створює собі окремий клас, але паралельно — ні
	workers: 1,
	timeout: 120_000,
	// dev-сервер компілює сторінку при першому запиті — перший перехід буває довгим
	expect: { timeout: 15_000 },
	globalSetup: './e2e/global-setup.ts',
	use: {
		baseURL: `http://localhost:${PORT}`,
		channel: 'chrome',
		viewport: { width: 1300, height: 1000 },
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure'
	},
	webServer: {
		command: `rm -f e2e.db && drizzle-kit migrate && vite dev --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}/login`,
		env: { DATABASE_URL: 'file:e2e.db' },
		// завжди свій сервер: інакше БД не буде свіжою
		reuseExistingServer: false
	}
});
