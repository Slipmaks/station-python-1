import type { Lesson } from '../types.js';
import intro from './intro.js';
import lists from './lists.js';

/** Усі уроки по порядку — учні бачать їх як «Урок 1», «Урок 2»… Новий урок — новий файл у цій теці й рядок тут. */
export const LESSONS: Lesson[] = [intro, lists];

const byId = new Map(LESSONS.flatMap(l => l.missions).map(m => [m.id, m]));
const owner = new Map(LESSONS.flatMap(l => l.missions.map(m => [m.id, l] as const)));
/** Відсік за id серед усіх уроків. */
export const findMission = (id: string) => byId.get(id);
/** Урок, якому належить відсік. */
export const lessonOf = (missionId: string) => owner.get(missionId);
export const findLesson = (id: string) => LESSONS.find(l => l.id === id);
/** Номер уроку, як його бачать учні: 1, 2… */
export const lessonNo = (l: Lesson) => LESSONS.indexOf(l) + 1;
