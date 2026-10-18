# Станція «Пітон-1»

Гра для уроків Python (інформатика, 9 клас): учні відновлюють космічну станцію, розв’язуючи задачі.
Учитель створює клас і дає учням код; учні входять за кодом класу, іменем і PIN, а прогрес і кожна спроба зберігаються в БД.
SvelteKit 3 + Svelte 5, БД — SQLite (libSQL / Turso) через Drizzle, деплой на Vercel.

## Локальний запуск

```sh
npm install
cp .env.example .env                       # DATABASE_URL=file:local.db
npm run db:migrate                         # створити таблиці
npm run teacher -- olena "Олена Петрівна"  # учитель; пароль буде надруковано
npm run dev                                # http://localhost:5173
```

Учитель входить на `/teacher/login`, створює клас і бачить його код. Учні — на `/login`.
Той самий `npm run teacher -- <логін>` видає новий пароль, якщо старий загубився.

```sh
npm test         # вміст уроків, правила зірок, безпека входу, перевірка даних API
npm run check    # типи
```

## Деплой: Turso + Vercel

1. БД у Turso:
   ```sh
   turso db create pyton1
   turso db show pyton1 --url          # → DATABASE_URL
   turso db tokens create pyton1       # → DATABASE_AUTH_TOKEN
   ```
2. Таблиці й перший учитель у продакшн-БД (змінні з оточення мають пріоритет над `.env`):
   ```sh
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run db:migrate
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run teacher -- olena "Олена Петрівна"
   ```
3. Vercel: імпортувати репозиторій, у Settings → Environment Variables задати `DATABASE_URL` і `DATABASE_AUTH_TOKEN`.

Після зміни схеми БД (`src/lib/server/db/schema.ts`): `npm run db:generate`, потім `npm run db:migrate` — локально й для Turso.

## Структура

| Шлях | Що там |
|---|---|
| `src/lib/lessons/` | Уроки: `intro.ts` — урок 1, `index.ts` — реєстр уроків |
| `src/lib/types.ts` | Формат уроку й відсіку (`Lesson`, `Mission`) — підказки редактора під час написання уроків |
| `src/lib/py.js` | Навчальний інтерпретатор підмножини Python (працює і в браузері, і на сервері) |
| `src/lib/grade.ts` | Перевірка розв’язку й правила зірок — чисті функції без DOM |
| `src/lib/state.svelte.ts` | Стан гри в браузері |
| `src/lib/sync.svelte.ts` | Черга запитів до сервера: без зв’язку повторює, нічого не губить |
| `src/lib/server/` | БД (`db/schema.ts`), сесії, PIN і паролі, перевірка даних API |
| `src/routes/(game)/` | Гра — лише для учнів, без SSR |
| `src/routes/login`, `teacher` | Вхід учня, кабінет учителя |
| `src/routes/api/` | Збереження: робочий стан, спроби, пройдені відсіки |
| `scripts/teacher.ts` | Створити вчителя / видати новий пароль |
| `drizzle/` | Міграції БД |
| `legacy/` | Початкова офлайн-версія в одному HTML |

## Що зберігається в БД

- `progress` — пройдені відсіки, найкращий результат у зірках;
- `attempts` — кожна спроба: код або відповідь, чи пройдено, скільки підказок відкрито;
- `workspaces` — чернетки коду й лічильники підказок/помилок (JSON на учня);
- `students` — ім’я, хеш PIN; після 5 неправильних PIN поспіль вхід блокується на 10 хвилин.

## Як додати відсік чи урок

1. Відсік — об’єкт у `missions` у файлі уроку (`src/lib/lessons/intro.ts`). Тип `Mission` підкаже поля:
   `kind: 'code'` — задача з кодом, `'choice'` — вікторина, `'types'` — сканер типів.
   `id` має бути унікальним серед усіх уроків — це ключ у БД.
2. Для задачі з кодом обов’язкові `starter`, `solution` і `checks` — функції, що отримують
   `{ src, res, out, inputs }` і повертають `true`/`false`. Готові помічники — у `src/lib/checks.ts`.
3. Новий урок — новий файл у `src/lib/lessons/` (за зразком `intro.ts`) і рядок у `index.ts`.
   Поки гра показує лише перший урок; вибір уроку — наступні етапи.
4. `npm test` — переконайся, що еталонний розв’язок проходить, а стартовий код — ні.

Інтерпретатор не підтримує `def`, `class`, `try` і словники — для уроків про них його доведеться розширити.
