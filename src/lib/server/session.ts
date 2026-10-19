import type { Cookies } from '@sveltejs/kit';
import { eq, lt } from 'drizzle-orm';
import { db } from './db/index.js';
import { classes, sessions, students, teachers } from './db/schema.js';
import { newToken, sha256 } from './secrets.js';

const COOKIE = 'session';
const HOUR = 3600_000;
// Учні часто сидять за спільними комп’ютерами: їхня cookie живе до закриття браузера, а сесія — не довше навчального дня.
const STUDENT_TTL = 12 * HOUR;
const TEACHER_TTL = 30 * 24 * HOUR;

export async function startSession(cookies: Cookies, owner: { studentId: number } | { teacherId: number }) {
	const token = newToken();
	const student = 'studentId' in owner;
	const ttl = student ? STUDENT_TTL : TEACHER_TTL;
	await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
	await db.insert(sessions).values({ id: sha256(token), expiresAt: new Date(Date.now() + ttl), ...owner });
	cookies.set(COOKIE, token, student ? { path: '/' } : { path: '/', maxAge: ttl / 1000 });
}

export async function readSession(cookies: Cookies) {
	const token = cookies.get(COOKIE);
	if (!token) return null;
	const row = await db
		.select({
			expiresAt: sessions.expiresAt,
			studentId: students.id,
			studentName: students.name,
			classId: classes.id,
			className: classes.name,
			unlockAll: classes.unlockAll,
			openLessons: classes.openLessons,
			teacherId: teachers.id,
			teacherName: teachers.name
		})
		.from(sessions)
		.leftJoin(students, eq(students.id, sessions.studentId))
		.leftJoin(classes, eq(classes.id, students.classId))
		.leftJoin(teachers, eq(teachers.id, sessions.teacherId))
		.where(eq(sessions.id, sha256(token)))
		.get();
	if (!row || row.expiresAt < new Date()) {
		cookies.delete(COOKIE, { path: '/' });
		return null;
	}
	return {
		student:
			row.studentId && row.classId
				? { id: row.studentId, name: row.studentName!, classId: row.classId, className: row.className!, unlockAll: !!row.unlockAll, lessons: row.openLessons ?? [] }
				: null,
		teacher: row.teacherId ? { id: row.teacherId, name: row.teacherName! } : null
	};
}

export async function endSession(cookies: Cookies) {
	const token = cookies.get(COOKIE);
	if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
	cookies.delete(COOKIE, { path: '/' });
}
