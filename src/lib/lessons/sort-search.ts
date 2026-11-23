import { count, lastLine, nums, outIs, pyFloat, stripStrings, tail } from '../checks.js';
import type { Lesson, Mission } from '../types.js';

/* Урок 4: сортування і пошук у списках (презентація «Уроки 19–20», п. 3.3). Відсіки відкриваються в порядку цього масиву. */

/** Без готового сортування: ні sort(), ні sorted(). */
const noSort = (src: string) => count(src, 'sort') === 0 && count(src, 'sorted') === 0;
/** Як Python виводить список дробових чисел. */
const floatList = (a: number[]) => '[' + a.map(pyFloat).join(', ') + ']';
const desc = (a: number[]) => [...a].sort((x, y) => y - x);

const missions: Mission[] = [
  {
    id: 'rank-board', name: 'Табло рейтингу', topic: 'Метод sort()', slide: '5–6', kind: 'code',
    story: 'Пілоти станції змагаються на симуляторі. Табло показує бали безладно — впорядкуй їх.',
    task: 'Відсортуй бали методом <code>sort()</code> за зростанням і виведи список. Потім відсортуй за спаданням — з <code>reverse=True</code> — і знову виведи список.',
    expected: '[-2, 4, 7, 10, 16, 23]\n[23, 16, 10, 7, 4, -2]',
    starter: 'a = [23, 7, 4, 16, -2, 10]\n',
    checks: [
      { label: 'Використано метод sort() і reverse=True', fn: c => count(c.src, 'sort') >= 1 && /\breverse\s*=\s*True\b/.test(stripStrings(c.src)) },
      { label: 'Готових списків у print() немає', fn: c => !/\bprint\(\s*\[/.test(c.src) },
      { label: 'Виведено бали за зростанням і за спаданням', fn: outIs('[-2, 4, 7, 10, 16, 23]\n[23, 16, 10, 7, 4, -2]'), diff: '[-2, 4, 7, 10, 16, 23]\n[23, 16, 10, 7, 4, -2]' },
    ],
    hints: [
      '<code>a.sort()</code> упорядковує сам список за зростанням. Щоб за спаданням, у дужках пишуть <code>reverse=True</code>.',
      '<code>a.sort()\nprint(a)\na.sort(reverse=True)\nprint(a)</code>',
    ],
    solution: 'a = [23, 7, 4, 16, -2, 10]\na.sort()\nprint(a)\na.sort(reverse=True)\nprint(a)',
    wrong: [
      'a = [23, 7, 4, 16, -2, 10]\nprint([-2, 4, 7, 10, 16, 23])\nprint([23, 16, 10, 7, 4, -2])',
      'a = [23, 7, 4, 16, -2, 10]\nsorted(a)\nprint(a)\nsorted(a, reverse=True)\nprint(a)',
      'a = [23, 7, 4, 16, -2, 10]\na.sort()\nprint(a)\nprint(a[::-1])',
    ],
    learned: 'a.sort() упорядковує сам список за зростанням, а a.sort(reverse=True) — за спаданням.',
  },
  {
    id: 'backup-sort', name: 'Резервна копія', topic: 'Функція sorted()', slide: '6', kind: 'code',
    story: 'Журнал прибуття кораблів має зберегти порядок, у якому їх записали. Але диспетчерові потрібен і впорядкований перелік.',
    task: 'Створи впорядковану копію <code>b</code> функцією <code>sorted()</code>, а сам список <code>a</code> не змінюй. Виведи спершу <code>a</code>, потім <code>b</code>.',
    expected: '[14, 9, 17, 11, 9]\n[9, 9, 11, 14, 17]',
    starter: 'a = [14, 9, 17, 11, 9]\n',
    checks: [
      { label: 'Копію створено функцією sorted(), без a.sort()', fn: c => count(c.src, 'sorted') >= 1 && count(c.src, 'sort') === 0 },
      { label: 'Виведено print(a) і print(b)', fn: c => /\bprint\(\s*a\s*\)/.test(stripStrings(c.src)) && /\bprint\(\s*b\s*\)/.test(stripStrings(c.src)) },
      { label: 'Виведено початковий список і впорядковану копію', fn: outIs('[14, 9, 17, 11, 9]\n[9, 9, 11, 14, 17]'), diff: '[14, 9, 17, 11, 9]\n[9, 9, 11, 14, 17]' },
    ],
    hints: [
      'Функція <code>sorted(a)</code> не змінює a, а повертає новий, упорядкований список. Збережи його в змінну.',
      '<code>b = sorted(a)\nprint(a)\nprint(b)</code>',
    ],
    solution: 'a = [14, 9, 17, 11, 9]\nb = sorted(a)\nprint(a)\nprint(b)',
    wrong: [
      'a = [14, 9, 17, 11, 9]\na.sort()\nb = a\nprint(a)\nprint(b)',
      'a = [14, 9, 17, 11, 9]\nb = sorted(a)\nprint(b)\nprint(a)',
      'a = [14, 9, 17, 11, 9]\nb = [9, 9, 11, 14, 17]\nprint(a)\nprint(b)',
    ],
    learned: 'sorted(a) створює новий упорядкований список, а початковий a лишається таким, як був.',
  },
  {
    id: 'swap-modules', name: 'Перестановка модулів', topic: 'Обмін значень', slide: '7', kind: 'code',
    story: 'Перший і останній модулі станції треба поміняти місцями. Робот-монтажник слухає лише програму.',
    task: 'Номери модулів уводяться одним рядком. Поміняй місцями перший і останній елементи списку й виведи список через пропуск: <code>print(*a)</code>.',
    expected: [['Модулі > ', 'out'], ['1 2 3 4', 'in'], ['\n4 2 3 1', 'out']],
    tests: [{ inputs: ['1 2 3 4'] }, { inputs: ['7 9'] }, { inputs: ['5 0 8'] }],
    inputsNote: 'Під час перевірки програма отримає рядок <b>1 2 3 4</b>, а потім рядки з іншою кількістю модулів.',
    starter: "a = list(map(int, input('Модулі > ').split()))\n",
    checks: [
      { label: 'Елементу a[0] присвоєно нове значення', fn: c => /\ba\[\s*0\s*\]\s*(,|=(?!=))/.test(stripStrings(c.src)) },
      { label: 'Список виведено однією командою print(*a)', fn: c => /\bprint\(\s*\*\s*a\s*\)/.test(stripStrings(c.src)) && count(c.src, 'print') === 1 },
      { label: 'Перший і останній модулі обміняно', fn: c => { const a = nums(c.inputs[0]); [a[0], a[a.length - 1]] = [a[a.length - 1], a[0]]; return lastLine(c) === a.join(' '); } },
    ],
    otherDataLabel: 'Працює для будь-якої кількості модулів',
    hints: [
      'Якщо написати <code>a[0] = a[-1]</code>, старе значення a[0] загубиться. У Python обидва значення обмінює одна команда: <code>x, y = y, x</code>.',
      '<code>a[0], a[-1] = a[-1], a[0]\nprint(*a)</code>',
    ],
    solution: "a = list(map(int, input('Модулі > ').split()))\na[0], a[-1] = a[-1], a[0]\nprint(*a)",
    wrong: [
      "a = list(map(int, input('Модулі > ').split()))\na[0] = a[-1]\na[-1] = a[0]\nprint(*a)",
      "a = list(map(int, input('Модулі > ').split()))\na[0], a[3] = a[3], a[0]\nprint(*a)",
      "a = list(map(int, input('Модулі > ').split()))\na[0] = a[0]\nprint(a[-1], a[1], a[2], a[0])",
    ],
    learned: 'a[i], a[j] = a[j], a[i] обмінює два елементи однією командою, і жодне значення не губиться.',
  },
  {
    id: 'order-quiz', name: 'Інструкція сортування', topic: 'Види впорядкування й алгоритми', slide: '5–12', kind: 'choice',
    story: 'Сортувальний робот вивчає інструкцію. Перевір, чи правильно він її зрозумів.',
    items: [
      { q: 'Як упорядковано список 1, 3, 3, 8?', options: ['За зростанням', 'За неспаданням', 'За спаданням', 'За незростанням'], answer: 1,
        explain: 'Є рівні сусіди 3 і 3, тож строго за зростанням список бути не може: кожен наступний не менший за попередній — це неспадання.' },
      { q: 'Чим відрізняються a.sort() і sorted(a)?', options: ['Нічим', 'sorted змінює сам список, а sort створює новий', 'sort змінює сам список, а sorted створює новий і не змінює a', 'sort сортує лише числа, а sorted — лише рядки'], answer: 2,
        explain: 'Метод sort упорядковує сам список і нічого не повертає. Функція sorted повертає новий список, а початковий не чіпає.' },
      { q: 'Як відсортувати список a за спаданням?', options: ['a.sort(reverse)', 'a.sort(-1)', 'a.reverse.sort()', 'a.sort(reverse=True)'], answer: 3,
        explain: 'Потрібно саме reverse=True. Без «= True» Python шукає змінну reverse і дає NameError.' },
      { q: 'Що відбувається на кожному кроці методу вибору?', options: ['Найменший елемент невідсортованої частини міняється місцями з її першим елементом', 'Порівнюються й обмінюються сусідні елементи', 'Найбільший елемент видаляється зі списку', 'Список ділиться навпіл'], answer: 0,
        explain: 'Метод вибору щоразу вибирає найменший у невідсортованій частині й ставить його на її початок.' },
      { q: 'Чому метод обміну називають «бульбашкою»?', options: ['Бо він найшвидший', 'Бо після кожного проходу найбільший елемент «спливає» в кінець списку', 'Бо він видаляє однакові елементи', 'Бо він працює лише з дробовими числами'], answer: 1,
        explain: 'Сусідні пари обмінюються, і великі значення поступово «спливають» у кінець, як бульбашки в газованій воді.' },
      { q: 'Скільки проходів робить програма методу обміну для списку з 10 чисел?', options: ['10', '45', '9', '1'], answer: 2,
        explain: 'Проходів n − 1: після дев’ятого на своєму місці вже й останні два елементи.' },
    ],
    learned: 'Рівні сусіди дають неспадання чи незростання; sort змінює список, sorted створює новий; вибір ставить найменший на початок, обмін «виштовхує» найбільший у кінець.',
  },
  {
    id: 'ore-sort', name: 'Сортувальник руди', topic: 'Метод вибору', slide: '8–9, 19', kind: 'code',
    story: 'Зразки руди з астероїда мають лягти в контейнери від найважчого до найлегшого. Програма сортування методом вибору вже є, але впорядковує навпаки.',
    task: 'Програма сортує маси методом вибору за зростанням. Зміни її так, щоб вона сортувала <b>за незростанням</b> — від найбільшого до найменшого. Готові <code>sort()</code> і <code>sorted()</code> не використовуй.',
    expected: [['Маси зразків > ', 'out'], ['3 -1 7 0 5', 'in'], ['\n[7.0, 5.0, 3.0, 0.0, -1.0]', 'out']],
    tests: [{ inputs: ['3 -1 7 0 5'] }, { inputs: ['4 8 1 9 2'] }, { inputs: ['2.5 2.5 -3 10'] }],
    inputsNote: 'Під час перевірки програма отримає маси <b>3 -1 7 0 5</b>, а потім ще два набори.',
    starter: "a = list(map(float, input('Маси зразків > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    mini = a[i]      # вважаємо найменшим\n    nmini = i        # і запам’ятовуємо індекс\n    for j in range(i + 1, n):\n        if a[j] < mini:\n            mini = a[j]\n            nmini = j\n    a[nmini] = a[i]  # обмін\n    a[i] = mini\nprint(a)\n",
    checks: [
      { label: 'Шукаємо найбільший: a[j] > mini', fn: c => /\ba\[\s*j\s*\]\s*>\s*mini\b/.test(stripStrings(c.src)) },
      { label: 'Без sort() і sorted()', fn: c => noSort(c.src) },
      { label: 'Маси впорядковано за незростанням', fn: c => lastLine(c) === floatList(desc(nums(c.inputs[0]))) },
    ],
    otherDataLabel: 'Працює для інших мас',
    hints: [
      'Щоб на початок ставав найбільший елемент, у невідсортованій частині треба шукати не найменший, а найбільший. Змінити треба лише одне порівняння.',
      'Рядок <code>if a[j] &lt; mini:</code> заміни на <code>if a[j] > mini:</code>',
    ],
    solution: "a = list(map(float, input('Маси зразків > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    mini = a[i]\n    nmini = i\n    for j in range(i + 1, n):\n        if a[j] > mini:\n            mini = a[j]\n            nmini = j\n    a[nmini] = a[i]\n    a[i] = mini\nprint(a)",
    wrong: [
      "a = list(map(float, input('Маси зразків > ').split()))\na.sort(reverse=True)\nprint(a)",
      "a = list(map(float, input('Маси зразків > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    mini = a[i]\n    nmini = i\n    for j in range(i + 1, n):\n        if a[j] > mini:\n            mini = a[j]\n            nmini = j\n    a[i] = mini\nprint(a)",
      "a = list(map(float, input('Маси зразків > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    mini = a[i]\n    nmini = i\n    for j in range(i + 1, n):\n        if a[j] < mini:\n            mini = a[j]\n            nmini = j\n    a[nmini] = a[i]\n    a[i] = mini\nprint(a[::-1])",
    ],
    learned: 'Метод вибору: у невідсортованій частині шукаємо найменший (чи найбільший) і обмінюємо з її першим елементом.',
  },
  {
    id: 'bubble-sort', name: 'Бульбашкова камера', topic: 'Метод обміну', slide: '10–11, 19', kind: 'code',
    story: 'У бульбашковій камері частинки вишиковуються за енергією. Допиши серце програми — порівняння й обмін сусідів.',
    task: 'Цикли методу обміну вже є. Замість <code>pass</code> допиши: якщо сусіди <code>a[j]</code> і <code>a[j + 1]</code> стоять не в тому порядку, обміняй їх <b>однією командою</b>. Список має впорядкуватися <b>за незростанням</b>.',
    expected: [['Числа > ', 'out'], ['4 8 1 9 2 7 3 6 5 0', 'in'], ['\n[9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0, 0.0]', 'out']],
    tests: [{ inputs: ['4 8 1 9 2 7 3 6 5 0'] }, { inputs: ['1.5 -2 3'] }, { inputs: ['0 0 1 -1'] }],
    inputsNote: 'Під час перевірки програма отримає <b>4 8 1 9 2 7 3 6 5 0</b>, а потім ще два набори чисел.',
    starter: "a = list(map(float, input('Числа > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        pass  # порівняй a[j] і a[j + 1] та обміняй їх, якщо треба\nprint(a)\n",
    checks: [
      { label: 'Сусідів обміняно однією командою: a[j], a[j + 1] = a[j + 1], a[j]', fn: c => /\ba\[\s*j\s*\]\s*,\s*a\[\s*j\s*\+\s*1\s*\]\s*=\s*a\[\s*j\s*\+\s*1\s*\]\s*,\s*a\[\s*j\s*\]/.test(stripStrings(c.src)) },
      { label: 'Без sort() і sorted()', fn: c => noSort(c.src) },
      { label: 'Числа впорядковано за незростанням', fn: c => lastLine(c) === floatList(desc(nums(c.inputs[0]))) },
    ],
    otherDataLabel: 'Працює для інших чисел',
    hints: [
      'За незростанням ліворуч має стояти більше число. Отже, обмінюємо, коли лівий сусід <i>менший</i> за правого.',
      '<code>if a[j] &lt; a[j + 1]:\n    a[j], a[j + 1] = a[j + 1], a[j]</code> — замість <code>pass</code>, з тим самим відступом.',
    ],
    solution: "a = list(map(float, input('Числа > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if a[j] < a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\nprint(a)",
    wrong: [
      "a = list(map(float, input('Числа > ').split()))\nprint(sorted(a, reverse=True))",
      "a = list(map(float, input('Числа > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if a[j] > a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\nprint(a)",
      "a = list(map(float, input('Числа > ').split()))\nn = len(a)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if a[j] < a[j + 1]:\n            x = a[j]\n            a[j] = a[j + 1]\n            a[j + 1] = x\nprint(a)",
    ],
    learned: 'Метод обміну порівнює сусідів і обмінює їх; змінивши знак порівняння, сортуємо за спаданням.',
  },
  {
    id: 'sort-decoder', name: 'Табло вильотів', topic: 'Що виведе програма?', slide: '4, 15', kind: 'choice',
    story: 'Табло вильотів зависло. Воно оживе, коли передбачиш, що виведе кожна програма. А потім подивишся, що виведе справжній Python.',
    items: [
      { code: 'a = [4, 9, 2, 7]\nprint(sorted(a))', options: ['[2, 4, 7, 9]', '[9, 7, 4, 2]', '[4, 9, 2, 7]', 'None'], answer: 0, codeOpts: true,
        explain: 'sorted повертає новий список, упорядкований за зростанням.' },
      { code: 'a = [4, 9, 2, 7]\nb = sorted(a)\nprint(a)', options: ['[2, 4, 7, 9]', '[4, 9, 2, 7]', 'None', '[7, 2, 9, 4]'], answer: 1, codeOpts: true,
        explain: 'sorted не змінює початковий список — упорядкована копія лежить у b.' },
      { code: 'a = [4, 9, 2, 7]\na.sort()\nprint(a[-1])', options: ['7', '2', '9', '4'], answer: 2, codeOpts: true,
        explain: 'Після sort() список став [2, 4, 7, 9], а a[-1] — останній, тобто найбільший.' },
      { code: 'a = [4, 9, 2, 7]\nprint(a.sort())', options: ['[2, 4, 7, 9]', 'None', '[4, 9, 2, 7]', '2'], answer: 1, codeOpts: true,
        explain: 'Метод sort змінює сам список і нічого не повертає — тому print виводить None.' },
      { code: 'a = [4, 9, 2, 7]\nprint(sorted(a, reverse=True)[0])', options: ['9', '2', '4', '[9, 7, 4, 2]'], answer: 0, codeOpts: true,
        explain: 'За спаданням першим стоїть найбільше число — 9.' },
      { code: 'a = [8, 3, 9]\na[0], a[2] = a[2], a[0]\nprint(a)', options: ['[9, 3, 9]', '[8, 3, 9]', '[3, 8, 9]', '[9, 3, 8]'], answer: 3, codeOpts: true,
        explain: 'Перший і останній елементи обмінялися місцями одночасно, тож жодне значення не загубилося.' },
    ],
    learned: 'sorted дає новий список, sort змінює наявний і повертає None, а обмін a[i], a[j] = a[j], a[i] нічого не губить.',
  },
  {
    id: 'find-all', name: 'Пеленгатор', topic: 'Пошук: чи є? скільки? де?', slide: '16', kind: 'code',
    story: 'Пеленгатор записав частоти радіосигналів. Знайди, чи є серед них шукана частота, скільки разів вона трапилась і де.',
    task: 'Уводяться частоти (одним рядком) і шукана частота. Якщо вона є, виведи два рядки: <b>Кількість: …</b> (метод <code>count</code>) і <b>Індекси: […]</b> — список індексів, зібраний циклом з <code>append</code>. Якщо частоти немає, виведи <b>Сигналу немає</b>.',
    expected: [['Частоти > ', 'out'], ['5 3 5 1 5', 'in'], ['\nШукана частота > ', 'out'], ['5', 'in'], ['\nКількість: 3\nІндекси: [0, 2, 4]', 'out']],
    tests: [{ inputs: ['5 3 5 1 5', '5'] }, { inputs: ['5 3 5 1 5', '2'] }, { inputs: ['7 2 7', '7'] }],
    inputsNote: 'Під час перевірки програма отримає частоти <b>5 3 5 1 5</b> і шукану <b>5</b>, а потім ще два набори — і такий, де частоти немає.',
    starter: "a = list(map(int, input('Частоти > ').split()))\nx = int(input('Шукана частота > '))\n",
    checks: [
      { label: 'Кількість знайдено методом count()', fn: c => count(c.src, 'count') >= 1 },
      { label: 'Індекси зібрано в циклі методом append()', fn: c => /\bfor\b[\s\S]*\bappend\s*\(/.test(stripStrings(c.src)) },
      { label: 'Правильний результат пошуку', fn: c => {
        const a = nums(c.inputs[0]), x = Number(c.inputs[1]), idx = a.flatMap((v, i) => (v === x ? [i] : []));
        return idx.length ? tail(c, 2) === 'Кількість: ' + idx.length + '\nІндекси: [' + idx.join(', ') + ']' : lastLine(c) === 'Сигналу немає';
      } },
    ],
    otherDataLabel: 'Працює для інших частот',
    hints: [
      'Спершу <code>if x in a:</code>. Усередині — <code>a.count(x)</code> для кількості, а для індексів — порожній список <code>b = []</code> і цикл, що додає <code>i</code>, коли <code>a[i] == x</code>.',
      "<code>if x in a:\n    print('Кількість:', a.count(x))\n    b = []\n    for i in range(len(a)):\n        if a[i] == x:\n            b.append(i)\n    print('Індекси:', b)\nelse:\n    print('Сигналу немає')</code>",
    ],
    solution: "a = list(map(int, input('Частоти > ').split()))\nx = int(input('Шукана частота > '))\nif x in a:\n    print('Кількість:', a.count(x))\n    b = []\n    for i in range(len(a)):\n        if a[i] == x:\n            b.append(i)\n    print('Індекси:', b)\nelse:\n    print('Сигналу немає')",
    wrong: [
      "a = list(map(int, input('Частоти > ').split()))\nx = int(input('Шукана частота > '))\nprint('Кількість:', a.count(x))\nb = []\nfor i in range(len(a)):\n    if a[i] == x:\n        b.append(i)\nprint('Індекси:', b)",
      "a = list(map(int, input('Частоти > ').split()))\nx = int(input('Шукана частота > '))\nif x in a:\n    print('Кількість:', a.count(x))\n    b = []\n    for i in range(len(a)):\n        if a[i] == x:\n            b.append(i + 1)\n    print('Індекси:', b)\nelse:\n    print('Сигналу немає')",
      "a = list(map(int, input('Частоти > ').split()))\nx = int(input('Шукана частота > '))\nif x in a:\n    print('Кількість:', a.count(x))\n    for i in range(1):\n        b = []\n        b.append(0)\n    print('Індекси: [0, 2, 4]')\nelse:\n    print('Сигналу немає')",
    ],
    learned: 'in відповідає «чи є?», count — «скільки?», а цикл з append(i) збирає відповідь на «де?».',
  },
  {
    id: 'dock-queue', name: 'Черга стикування', topic: 'Уставлення у впорядкований список', slide: '17', kind: 'code',
    story: 'Кораблі стикуються в порядку часу прибуття. Новий корабель треба вставити в чергу так, щоб порядок не порушився.',
    task: 'Черга <code>a</code> упорядкована за неспаданням. Устав час прибуття <code>x</code> перед першим більшим числом методом <code>insert</code>; якщо більших немає — додай у кінець. Виведи чергу. <code>sort()</code> і <code>sorted()</code> не використовуй.',
    expected: [['Час прибуття > ', 'out'], ['5', 'in'], ['\n[2, 4, 4, 5, 6, 8, 10]', 'out']],
    tests: [{ inputs: ['5'] }, { inputs: ['12'] }, { inputs: ['1'] }],
    inputsNote: 'Під час перевірки програма отримає час <b>5</b>, а потім <b>12</b> (більший за всі) і <b>1</b> (менший за всі).',
    starter: "a = [2, 4, 4, 6, 8, 10]\nx = int(input('Час прибуття > '))\n",
    checks: [
      { label: 'Число вставлено методом insert()', fn: c => count(c.src, 'insert') >= 1 },
      { label: 'Без sort() і sorted()', fn: c => noSort(c.src) },
      { label: 'Число стоїть на своєму місці в черзі', fn: c => {
        const a = [2, 4, 4, 6, 8, 10], x = Number(c.inputs[0]), i = a.findIndex(v => v > x);
        a.splice(i < 0 ? a.length : i, 0, x);
        return lastLine(c) === '[' + a.join(', ') + ']';
      } },
    ],
    otherDataLabel: 'Працює для будь-якого часу',
    hints: [
      'Шукай циклом перше <code>a[i]</code>, більше за x, і встав перед ним: <code>a.insert(i, x)</code>, потім <code>break</code>. Прапорець <code>f</code> підкаже після циклу, чи місце знайшлося; якщо ні — <code>a.append(x)</code>.',
      '<code>f = False\nfor i in range(len(a)):\n    if x &lt; a[i]:\n        a.insert(i, x)\n        f = True\n        break\nif f == False:\n    a.append(x)\nprint(a)</code>',
    ],
    solution: "a = [2, 4, 4, 6, 8, 10]\nx = int(input('Час прибуття > '))\nf = False\nfor i in range(len(a)):\n    if x < a[i]:\n        a.insert(i, x)\n        f = True\n        break\nif f == False:\n    a.append(x)\nprint(a)",
    wrong: [
      "a = [2, 4, 4, 6, 8, 10]\nx = int(input('Час прибуття > '))\na.append(x)\na.sort()\nprint(a)",
      "a = [2, 4, 4, 6, 8, 10]\nx = int(input('Час прибуття > '))\nfor i in range(len(a)):\n    if x < a[i]:\n        a.insert(i, x)\n        break\nprint(a)",
      "a = [2, 4, 4, 6, 8, 10]\nx = int(input('Час прибуття > '))\na.insert(3, x)\nprint(a)",
    ],
    learned: 'У впорядкований список число вставляють перед першим більшим: a.insert(i, x), а якщо більших немає — append.',
  },
  {
    id: 'honor-roll', name: 'Дошка пошани', topic: 'Пошук за умовою', slide: '18', kind: 'code',
    story: 'На дошку пошани потрапляють члени екіпажу з оцінкою 10 і вище. Знайди їхні номери в журналі.',
    task: 'Оцінки екіпажу вводяться одним рядком. Збери в список <code>b</code> номери в журналі (індекс + 1) тих, у кого оцінка не нижча за 10. Виведи <b>Номери: […]</b> і <b>Кількість: …</b>',
    expected: [['Оцінки > ', 'out'], ['9 11 7 12 10 6', 'in'], ['\nНомери: [2, 4, 5]\nКількість: 3', 'out']],
    tests: [{ inputs: ['9 11 7 12 10 6'] }, { inputs: ['10 10 3'] }, { inputs: ['5 6 7'] }],
    inputsNote: 'Під час перевірки програма отримає оцінки <b>9 11 7 12 10 6</b>, а потім ще два набори — зокрема без жодної оцінки від 10.',
    starter: "a = list(map(int, input('Оцінки > ').split()))\n",
    checks: [
      { label: 'Номери зібрано в циклі методом append()', fn: c => /\bfor\b[\s\S]*\bappend\s*\(/.test(stripStrings(c.src)) },
      { label: 'Кількість знайдено функцією len()', fn: c => count(c.src, 'len') >= 1 },
      { label: 'Виведено номери й кількість', fn: c => {
        const b = nums(c.inputs[0]).flatMap((v, i) => (v >= 10 ? [i + 1] : []));
        return tail(c, 2) === 'Номери: [' + b.join(', ') + ']\nКількість: ' + b.length;
      } },
    ],
    otherDataLabel: 'Працює для інших оцінок',
    hints: [
      'Шаблон пошуку за умовою: порожній список → цикл → if умова → append. Індекси починаються з 0, а номери в журналі — з 1, тому додавай <code>i + 1</code>.',
      "<code>b = []\nfor i in range(len(a)):\n    if a[i] >= 10:\n        b.append(i + 1)\nprint('Номери:', b)\nprint('Кількість:', len(b))</code>",
    ],
    solution: "a = list(map(int, input('Оцінки > ').split()))\nb = []\nfor i in range(len(a)):\n    if a[i] >= 10:\n        b.append(i + 1)\nprint('Номери:', b)\nprint('Кількість:', len(b))",
    wrong: [
      "a = list(map(int, input('Оцінки > ').split()))\nb = []\nfor i in range(len(a)):\n    if a[i] >= 10:\n        b.append(i)\nprint('Номери:', b)\nprint('Кількість:', len(b))",
      "a = list(map(int, input('Оцінки > ').split()))\nb = []\nfor i in range(len(a)):\n    if a[i] > 10:\n        b.append(i + 1)\nprint('Номери:', b)\nprint('Кількість:', len(b))",
      "a = list(map(int, input('Оцінки > ').split()))\nb = []\nfor i in range(1):\n    b.append(0)\nprint('Номери: [2, 4, 5]')\nprint('Кількість:', len(b) + 2)",
    ],
    learned: 'Шукати за умовою — це порожній список, цикл, if і append; len(b) показує, скільки знайдено.',
  },
  {
    id: 'sort-repair', name: 'Ремонт сортувальника', topic: 'Типові помилки', slide: '7, 21', kind: 'code',
    story: 'Сортувальна лінія станції зупинилася: у програмах помилки. Полагодь п’ять програм — кожну запусти й виправ.',
    steps: [
      { task: 'Програма має вивести впорядковану копію списку — <b>[1, 3, 5, 8]</b>.', expected: '[1, 3, 5, 8]', starter: 'a = [5, 3, 8, 1]\nb = a.sort()\nprint(b)\n',
        hint: 'Метод sort нічого не повертає, тож у b потрапляє None. Копію повертає функція sorted(a).', solution: 'a = [5, 3, 8, 1]\nb = sorted(a)\nprint(b)' },
      { task: 'Програма має обміняти значення x і y та вивести <b>7 3</b>.', expected: '7 3', starter: 'x = 3\ny = 7\nx = y\ny = x\nprint(x, y)\n',
        hint: 'Після x = y старе значення x загублено. Обміняй обидва однією командою: x, y = y, x.', solution: 'x = 3\ny = 7\nx, y = y, x\nprint(x, y)' },
      { task: 'Програма методу обміну має вивести <b>[5, 6, 13, 18]</b>.', expected: '[5, 6, 13, 18]', starter: 'a = [13, 6, 5, 18]\nn = len(a)\nfor i in range(n - 1):\n    for j in range(n):\n        if a[j] > a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\nprint(a)\n',
        hint: 'На останньому j елемента a[j + 1] вже немає — IndexError. Внутрішній цикл має йти до n - 1 - i.', solution: 'a = [13, 6, 5, 18]\nn = len(a)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if a[j] > a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\nprint(a)' },
      { task: 'Програма має відсортувати список за спаданням і вивести <b>[8, 5, 3, 1]</b>.', expected: '[8, 5, 3, 1]', starter: 'a = [5, 3, 8, 1]\na.sort(reverse)\nprint(a)\n',
        hint: 'Python шукає змінну reverse і не знаходить її — NameError. Треба написати reverse=True.', solution: 'a = [5, 3, 8, 1]\na.sort(reverse=True)\nprint(a)' },
      { task: 'Програма має вивести впорядкований список <b>[1, 3, 5, 8]</b>, але виводить невпорядкований.', expected: '[1, 3, 5, 8]', starter: 'a = [5, 3, 8, 1]\na.sort\nprint(a)\n',
        hint: 'Помилки немає, але без дужок метод не викликається: потрібно a.sort().', solution: 'a = [5, 3, 8, 1]\na.sort()\nprint(a)' },
    ],
    learned: 'sort() повертає None і пишеться з дужками, обмін — x, y = y, x, сусідів порівнюють до n - 1 - i, а спадання — reverse=True.',
  },
  {
    id: 'relay', name: 'Космічна естафета', topic: 'Сортування двох списків', slide: '20', kind: 'code',
    story: 'Екіпаж пробіг естафету навколо станції. Склади протокол: імена учасників від найшвидшого до найповільнішого.',
    task: 'У списку <code>nm</code> — імена, у списку <code>t</code> — їхній час. Відсортуй <code>t</code> за зростанням методом обміну і щоразу, коли міняєш місцями два часи, міняй місцями й відповідні імена. Виведи імена через пропуск: <code>print(*nm)</code>.',
    expected: 'Богдан Тарас Ірина Оксана',
    starter: "nm = ['Оксана', 'Тарас', 'Ірина', 'Богдан']\nt = [14.2, 13.1, 13.8, 12.9]\nn = len(t)\n",
    checks: [
      { label: 'Імена обмінюються разом з часом: nm[j], nm[j + 1] = …', fn: c => /\bnm\[[^\]\n]+\]\s*(,[^=\n]*)?=(?!=)/.test(stripStrings(c.src)) && /\bt\[[^\]\n]+\]\s*(,[^=\n]*)?=(?!=)/.test(stripStrings(c.src)) },
      { label: 'Без sort(), sorted() і без готової відповіді', fn: c => noSort(c.src) && ['Оксана', 'Тарас', 'Ірина', 'Богдан'].every(s => c.src.split(s).length === 2) && /\bprint\(\s*\*\s*nm\s*\)/.test(stripStrings(c.src)) },
      { label: 'Виведено Богдан Тарас Ірина Оксана', fn: outIs('Богдан Тарас Ірина Оксана'), diff: 'Богдан Тарас Ірина Оксана' },
    ],
    hints: [
      'Це звичайний метод обміну для списку t. Різниця одна: поруч з обміном <code>t[j]</code> і <code>t[j + 1]</code> обмінюй так само <code>nm[j]</code> і <code>nm[j + 1]</code>.',
      '<code>for i in range(n - 1):\n    for j in range(n - 1 - i):\n        if t[j] > t[j + 1]:\n            t[j], t[j + 1] = t[j + 1], t[j]\n            nm[j], nm[j + 1] = nm[j + 1], nm[j]\nprint(*nm)</code>',
    ],
    solution: "nm = ['Оксана', 'Тарас', 'Ірина', 'Богдан']\nt = [14.2, 13.1, 13.8, 12.9]\nn = len(t)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if t[j] > t[j + 1]:\n            t[j], t[j + 1] = t[j + 1], t[j]\n            nm[j], nm[j + 1] = nm[j + 1], nm[j]\nprint(*nm)",
    wrong: [
      "nm = ['Оксана', 'Тарас', 'Ірина', 'Богдан']\nt = [14.2, 13.1, 13.8, 12.9]\nn = len(t)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if t[j] > t[j + 1]:\n            t[j], t[j + 1] = t[j + 1], t[j]\nprint(*nm)",
      "nm = ['Оксана', 'Тарас', 'Ірина', 'Богдан']\nt = [14.2, 13.1, 13.8, 12.9]\nn = len(t)\nfor i in range(1):\n    t[0], nm[0] = t[0], nm[0]\nprint('Богдан Тарас Ірина Оксана')",
      "nm = ['Оксана', 'Тарас', 'Ірина', 'Богдан']\nt = [14.2, 13.1, 13.8, 12.9]\nn = len(t)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if t[j] > t[j + 1]:\n            t[j], t[j + 1] = t[j + 1], t[j]\n            nm[j], nm[j + 1] = nm[j + 1], nm[j]\nnm.sort()\nprint(*nm)",
    ],
    learned: 'Два пов’язані списки сортують разом: обмінюючи елементи одного, так само обмінюють відповідні елементи іншого.',
  },
];

const examples: [string, string][] = [
  ['sort і sorted', "a = [5, 3, 8, 1]\nb = sorted(a)\nprint(a, b)\na.sort()\nprint(a)\na.sort(reverse=True)\nprint(a)\n"],
  ['Обмін значень', "x = 3\ny = 7\nx, y = y, x\nprint(x, y)\na = [8, 3, 9]\na[0], a[2] = a[2], a[0]\nprint(a)\n"],
  ['Метод вибору', "a = [23, 7, 4, 16, -2, 10]\nn = len(a)\nfor i in range(n - 1):\n    mini = a[i]\n    nmini = i\n    for j in range(i + 1, n):\n        if a[j] < mini:\n            mini = a[j]\n            nmini = j\n    a[nmini] = a[i]\n    a[i] = mini\n    print('Крок', i + 1, a)\n"],
  ['Метод обміну', "a = [13, 6, 5, 18, 11, 10]\nn = len(a)\nfor i in range(n - 1):\n    for j in range(n - 1 - i):\n        if a[j] > a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\n    print('Прохід', i + 1, a)\n"],
  ['Чи є? Скільки? Де?', "a = [5, 3, 5, 1, 5]\nx = 5\nprint(x in a, a.count(x))\nb = []\nfor i in range(len(a)):\n    if a[i] == x:\n        b.append(i)\nprint('Індекси:', b)\n"],
  ['Уставлення в порядок', "a = [2, 4, 4, 6, 8, 10]\nx = 5\nf = False\nfor i in range(len(a)):\n    if x < a[i]:\n        a.insert(i, x)\n        f = True\n        break\nif f == False:\n    a.append(x)\nprint(a)\n"],
];

const lesson: Lesson = {
  id: 'sort-search',
  title: 'Сортування і пошук у списках',
  missions,
  examples,
  certificate: {
    ranks: [
      { from: 0.9, title: 'Архітектор алгоритмів' },
      { from: 0.67, title: 'Диспетчер черги' },
      { from: 0, title: 'Юнга-сортувальник' },
    ],
    summary: 'Ти вмієш сортувати списки методом sort і функцією sorted, обмінювати значення, пояснювати методи вибору й обміну, шукати значення, вставляти їх у впорядкований список і знаходити елементи за умовою.',
    next: 'Наступного уроку — рядкові величини: як працювати з текстом.',
  },
};
export default lesson;
