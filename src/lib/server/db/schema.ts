import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { Workspace } from '../../types.js';

const createdAt = () => integer({ mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date());

export const teachers = sqliteTable('teachers', {
	id: integer().primaryKey({ autoIncrement: true }),
	login: text().notNull().unique(),
	name: text().notNull(),
	passwordHash: text().notNull(),
	createdAt: createdAt()
});

export const classes = sqliteTable('classes', {
	id: integer().primaryKey({ autoIncrement: true }),
	teacherId: integer().notNull().references(() => teachers.id),
	name: text().notNull(),
	/** Код, який учні вводять під час входу. */
	code: text().notNull().unique(),
	/** Усі відсіки відкриті одразу, без проходження по черзі. */
	unlockAll: integer({ mode: 'boolean' }).notNull().default(false),
	createdAt: createdAt()
});

export const students = sqliteTable(
	'students',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		classId: integer().notNull().references(() => classes.id),
		name: text().notNull(),
		/** Ім’я в нижньому регістрі з однаковими апострофами — щоб «Мар’яна» і «мар'яна» були однією людиною. */
		nameKey: text().notNull(),
		pinHash: text().notNull(),
		failedPins: integer().notNull().default(0),
		lockedUntil: integer({ mode: 'timestamp_ms' }),
		createdAt: createdAt()
	},
	t => [uniqueIndex('students_class_name').on(t.classId, t.nameKey)]
);

/** Сесія належить або учню, або вчителю. id — SHA-256 від токена з cookie, сам токен не зберігаємо. */
export const sessions = sqliteTable('sessions', {
	id: text().primaryKey(),
	studentId: integer().references(() => students.id),
	teacherId: integer().references(() => teachers.id),
	expiresAt: integer({ mode: 'timestamp_ms' }).notNull()
});

/** Пройдені відсіки: найкращий результат. */
export const progress = sqliteTable(
	'progress',
	{
		studentId: integer().notNull().references(() => students.id),
		missionId: text().notNull(),
		stars: integer().notNull(),
		completedAt: createdAt()
	},
	t => [primaryKey({ columns: [t.studentId, t.missionId] })]
);

/** Кожна спроба: запуск коду або відповідь у вікторині. Основа для звітів учителю. */
export const attempts = sqliteTable(
	'attempts',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		studentId: integer().notNull().references(() => students.id),
		missionId: text().notNull(),
		/** Крок відсіку: номер програми в ремонтному відсіку або номер запитання. */
		step: integer().notNull().default(0),
		/** Код учня або обрана відповідь. */
		answer: text().notNull(),
		/** Перевіряє сервер, а не браузер. */
		passed: integer({ mode: 'boolean' }).notNull(),
		/** Скільки підказок було відкрито на момент спроби. */
		hints: integer().notNull().default(0),
		/** Учень відкривав розв’язок у цьому проходженні відсіку. */
		sol: integer({ mode: 'boolean' }).notNull().default(false),
		/** Зірки, якщо ця спроба завершила відсік; наступні спроби — вже нове проходження. */
		stars: integer(),
		createdAt: createdAt()
	},
	t => [index('attempts_student_mission').on(t.studentId, t.missionId)]
);

/** Робочий стан гри учня одним JSON: чернетки коду, лічильники підказок і помилок, поточні кроки. */
export const workspaces = sqliteTable('workspaces', {
	studentId: integer().primaryKey().references(() => students.id),
	data: text({ mode: 'json' }).notNull().$type<Workspace>(),
	updatedAt: createdAt()
});
