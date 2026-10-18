import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import { DATABASE_AUTH_TOKEN, DATABASE_URL } from '$app/env/private';

const client = createClient({ url: DATABASE_URL, authToken: DATABASE_AUTH_TOKEN });

export const db = drizzle(client, { schema, casing: 'snake_case' });
