import type { Lesson } from '../types.js';
import intro from './intro.js';

/** Усі уроки. Новий урок — новий файл у цій теці й рядок тут. */
export const LESSONS: Lesson[] = [intro];

/* ponytail: гра поки показує одну станцію — перший урок; вибір уроку з’явиться на етапі 5. */
export const lesson = LESSONS[0];
export const MISSIONS = lesson.missions;

const byId = new Map(LESSONS.flatMap(l => l.missions).map(m => [m.id, m]));
/** Відсік за id серед усіх уроків. */
export const findMission = (id: string) => byId.get(id);
