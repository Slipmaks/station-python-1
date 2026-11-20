import { inArray } from 'drizzle-orm';
import { db } from './db/index.js';
import { attempts, progress, sessions, students, workspaces } from './db/schema.js';

/** Учнів і всі їхні дані — одним пакетом: або все, або нічого. */
export async function deleteStudents(ids: number[]) {
	if (!ids.length) return;
	await db.batch([
		db.delete(attempts).where(inArray(attempts.studentId, ids)),
		db.delete(progress).where(inArray(progress.studentId, ids)),
		db.delete(workspaces).where(inArray(workspaces.studentId, ids)),
		db.delete(sessions).where(inArray(sessions.studentId, ids)),
		db.delete(students).where(inArray(students.id, ids))
	]);
}
