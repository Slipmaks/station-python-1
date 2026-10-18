import { defineConfig } from 'drizzle-kit';

// .env — як у застосунку; змінні, задані в оточенні (напр. для Turso), мають пріоритет
try { process.loadEnvFile(); } catch {}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	// turso — це libSQL: працює і з локальним file:, і з libsql://
	dialect: 'turso',
	casing: 'snake_case',
	dbCredentials: { url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN },
	verbose: true,
	strict: true
});
