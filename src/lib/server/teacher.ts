import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { classes, students } from './db/schema.js';

/* Доступ учителя: лише свої класи й учні цих класів. Чуже — 404, щоб не підказувати, що такий id існує. */

export async function requireClass(locals: App.Locals, id: string) {
	const t = locals.teacher;
	if (!t) redirect(303, '/teacher/login');
	const cls = await db.select().from(classes).where(and(eq(classes.id, Number(id)), eq(classes.teacherId, t.id))).get();
	if (!cls) error(404, 'Клас не знайдено');
	return cls;
}

export async function requireStudent(locals: App.Locals, classId: string, studentId: string) {
	const cls = await requireClass(locals, classId);
	const st = await db.select().from(students).where(and(eq(students.id, Number(studentId)), eq(students.classId, cls.id))).get();
	if (!st) error(404, 'Учня не знайдено');
	return { cls, st };
}
