// Лише node:crypto й жодних імпортів SvelteKit: модуль використовує і скрипт scripts/teacher.ts.
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (secret: string, salt: Buffer, len: number) => Promise<Buffer>;

/** Хеш PIN-коду чи пароля: «сіль:хеш» у hex (scrypt). */
export async function hashSecret(secret: string) {
	const salt = randomBytes(16);
	return `${salt.toString('hex')}:${(await scryptAsync(secret, salt, 32)).toString('hex')}`;
}
export async function verifySecret(secret: string, stored: string) {
	const [salt, hash] = stored.split(':');
	return timingSafeEqual(await scryptAsync(secret, Buffer.from(salt, 'hex'), 32), Buffer.from(hash, 'hex'));
}

export const newToken = () => randomBytes(20).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// без 0/O та 1/I, щоб їх не плутали, переписуючи з дошки
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomChars = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
export const newClassCode = () => randomChars(6);
export const newPassword = () => [randomChars(4), randomChars(4), randomChars(4)].join('-');
/** Код класу, як його ввів учень: регістр, пробіли й дефіси не важливі. */
export const cleanCode = (s: string) => s.toUpperCase().replace(/[\s-]/g, '');

export const cleanName = (s: string) => s.trim().replace(/\s+/g, ' ');
/** Ключ для пошуку однакових імен: регістр і вид апострофа не важливі. */
export const nameKey = (s: string) => cleanName(s).toLocaleLowerCase('uk').replace(/[’ʼ`]/g, "'");
export const isPin = (s: string) => /^\d{4}$/.test(s);

/** Захист від підбору PIN: після PIN_TRIES помилок поспіль вхід блокується на PIN_LOCK_MS. */
export const PIN_TRIES = 5;
export const PIN_LOCK_MS = 10 * 60 * 1000;
export function afterWrongPin(failedPins: number, now: number) {
	const failed = failedPins + 1;
	return failed >= PIN_TRIES
		? { failedPins: 0, lockedUntil: new Date(now + PIN_LOCK_MS) }
		: { failedPins: failed, lockedUntil: null };
}
