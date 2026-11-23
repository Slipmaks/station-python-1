import { count, lastLine, nums, outIs, pyFloat, stripStrings, tail } from '../checks.js';
import type { Lesson, Mission } from '../types.js';

/* Урок 3: опрацювання списків (презентація «Уроки 16–18», п. 3.2, практична робота № 4). Відсіки відкриваються в порядку цього масиву. */

/** Є хоча б n зрізів списку a: a[…:…]. */
const slices = (src: string, n: number) => (stripStrings(src).match(/\ba\[[^\]\n]*:[^\]\n]*\]/g) || []).length >= n;

const missions: Mission[] = [
  {
    id: 'tail-signal', name: 'Останній сигнал', topic: 'Від’ємні індекси: a[-1]', slide: '5', kind: 'code',
    story: 'Зонд передає силу сигналу, і щоразу замірів — різна кількість. Командирові потрібні лише два найсвіжіші — з кінця списку.',
    task: 'Заміри вводяться одним рядком — цей рядок уже є в програмі. Виведи через пропуск <b>останній</b>, а потім <b>передостанній</b> замір. Скільки замірів, заздалегідь невідомо — бери їх з кінця від’ємними індексами.',
    expected: [['Сила сигналу > ', 'out'], ['7 3 9 12 5', 'in'], ['\n5 12', 'out']],
    tests: [{ inputs: ['7 3 9 12 5'] }, { inputs: ['4 8'] }, { inputs: ['10 20 30 40 50 60 70'] }],
    inputsNote: 'Під час перевірки програма отримає рядок <b>7 3 9 12 5</b>, а потім рядки з іншою кількістю чисел.',
    starter: "a = list(map(int, input('Сила сигналу > ').split()))\n",
    checks: [
      { label: 'Використано від’ємні індекси: a[-1]', fn: c => /\ba\[\s*-\s*\d/.test(stripStrings(c.src)) },
      { label: 'Виведено останній і передостанній заміри', fn: c => { const a = nums(c.inputs[0]); return lastLine(c) === a[a.length - 1] + ' ' + a[a.length - 2]; } },
    ],
    otherDataLabel: 'Працює для будь-якої кількості замірів',
    hints: [
      'Від’ємний індекс рахує з кінця: <code>a[-1]</code> — останній елемент, <code>a[-2]</code> — передостанній. Довжина списку для цього не потрібна.',
      '<code>print(a[-1], a[-2])</code>',
    ],
    solution: "a = list(map(int, input('Сила сигналу > ').split()))\nprint(a[-1], a[-2])",
    wrong: [
      "a = list(map(int, input('Сила сигналу > ').split()))\nprint(a[4], a[3])",
      "a = list(map(int, input('Сила сигналу > ').split()))\nprint(a[-2], a[-1])",
      "a = list(map(int, input('Сила сигналу > ').split()))\nprint(a[len(a) - 1], a[len(a) - 2])",
    ],
    learned: 'a[-1] — останній елемент, a[-2] — передостанній: від’ємні індекси рахують з кінця, і довжину знати не треба.',
  },
  {
    id: 'telemetry', name: 'Телеметрія', topic: 'Зрізи: a[i:j:step]', slide: '7–8', kind: 'code',
    story: 'Бортовий журнал зберіг десять замірів телеметрії. Інженерам потрібні лише частини списку — виріж їх зрізами.',
    task: 'Виведи трьома командами <code>print</code>, кожну частину з нового рядка:<br>1. перші три заміри;<br>2. заміри з номерами від 2 до 5 включно;<br>3. усі заміри у зворотному порядку.<br>Готових списків не пиши — лише зрізи списку <code>a</code>.',
    expected: '[2, 4, 6]\n[6, 8, 10, 12]\n[20, 18, 16, 14, 12, 10, 8, 6, 4, 2]',
    starter: 'a = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\n',
    checks: [
      { label: 'Використано три зрізи: a[…:…]', fn: c => slices(c.src, 3) },
      { label: 'Готових списків у print() немає', fn: c => !/\bprint\(\s*\[/.test(c.src) },
      { label: 'Виведено три потрібні частини списку', fn: outIs('[2, 4, 6]\n[6, 8, 10, 12]\n[20, 18, 16, 14, 12, 10, 8, 6, 4, 2]'), diff: '[2, 4, 6]\n[6, 8, 10, 12]\n[20, 18, 16, 14, 12, 10, 8, 6, 4, 2]' },
    ],
    hints: [
      'У зрізі <code>a[i:j]</code> елемент з номером i входить, а з номером j — ні. Пропущений початок — від першого, пропущений кінець — до останнього, крок <code>-1</code> — справа наліво.',
      '<code>print(a[:3])\nprint(a[2:6])\nprint(a[::-1])</code>',
    ],
    solution: 'a = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\nprint(a[:3])\nprint(a[2:6])\nprint(a[::-1])',
    wrong: [
      'a = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\nprint([2, 4, 6])\nprint([6, 8, 10, 12])\nprint([20, 18, 16, 14, 12, 10, 8, 6, 4, 2])',
      'a = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\nprint(a[:3])\nprint(a[2:5])\nprint(a[::-1])',
      'a = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\nprint(a[:3])\nprint(a[2:6])\nprint(a[9:0:-1])',
    ],
    learned: 'Зріз a[i:j:step] бере частину списку: елемент з номером j не входить, а a[::-1] перевертає список.',
  },
  {
    id: 'mirror-lock', name: 'Дзеркальний шлюз', topic: 'Паліндром: a[::-1]', slide: '10', kind: 'code',
    story: 'Дзеркальний шлюз відчиняється лише кодом-паліндромом — він однаково читається зліва направо й справа наліво, як 3 5 3.',
    task: 'Код уводиться одним рядком чисел. Якщо код — паліндром, виведи <b>Паліндром</b>, інакше — <b>Не паліндром</b>.',
    expected: [['Код > ', 'out'], ['2 4 6 6 4 2', 'in'], ['\nПаліндром', 'out']],
    tests: [{ inputs: ['2 4 6 6 4 2'] }, { inputs: ['1 2 3'] }, { inputs: ['3 5 3'] }],
    inputsNote: 'Під час перевірки програма отримає код <b>2 4 6 6 4 2</b>, а потім ще два коди — паліндром і ні.',
    starter: "a = list(map(int, input('Код > ').split()))\n",
    checks: [
      { label: 'Список порівняно з перевернутим: a[::-1] (або пари з країв a[-i - 1])', fn: c => /\[\s*::\s*-\s*1\s*\]|\ba\[\s*-\s*i\b/.test(stripStrings(c.src)) },
      { label: 'Правильно визначено, чи код — паліндром', fn: c => { const a = nums(c.inputs[0]); return lastLine(c) === (a.join() === [...a].reverse().join() ? 'Паліндром' : 'Не паліндром'); } },
    ],
    otherDataLabel: 'Працює для інших кодів',
    hints: [
      'Перевернутий список — зріз <code>a[::-1]</code>. Якщо він дорівнює самому списку (<code>==</code>), то це паліндром.',
      "<code>if a == a[::-1]:\n    print('Паліндром')\nelse:\n    print('Не паліндром')</code>",
    ],
    solution: "a = list(map(int, input('Код > ').split()))\nif a == a[::-1]:\n    print('Паліндром')\nelse:\n    print('Не паліндром')",
    wrong: [
      "a = list(map(int, input('Код > ').split()))\nb = a[::-1]\nprint('Паліндром')",
      "a = list(map(int, input('Код > ').split()))\nif a == a[::-1]:\n    print('Не паліндром')\nelse:\n    print('Паліндром')",
      "a = list(map(int, input('Код > ').split()))\nif a[0] == a[-1]:\n    print('Паліндром')\nelse:\n    print('Не паліндром')",
    ],
    learned: 'a == a[::-1] перевіряє, чи список — паліндром: зріз з кроком -1 перевертає список.',
  },
  {
    id: 'spare-parts', name: 'Склад запчастин', topic: 'Операція in', slide: '9', kind: 'code',
    story: 'Інженер шукає деталь для ремонту антени. Комп’ютер складу знає номери всіх деталей — перевір, чи є потрібна.',
    task: 'Спершу вводяться номери деталей на складі (одним рядком), потім — номер потрібної деталі. Якщо вона є, виведи <b>Деталь є на складі</b>, інакше — <b>Деталі немає</b>. Перевір операцією <code>in</code>.',
    expected: [['Номери деталей > ', 'out'], ['12 7 33 5 18', 'in'], ['\nПотрібна деталь > ', 'out'], ['33', 'in'], ['\nДеталь є на складі', 'out']],
    tests: [{ inputs: ['12 7 33 5 18', '33'] }, { inputs: ['12 7 33 5 18', '8'] }, { inputs: ['4 9', '9'] }],
    inputsNote: 'Під час перевірки програма отримає склад <b>12 7 33 5 18</b> і деталь <b>33</b>, а потім ще два набори — з деталлю, якої немає, і якою є.',
    starter: "a = list(map(int, input('Номери деталей > ').split()))\n",
    checks: [
      { label: 'Наявність перевірено операцією in в умові if', fn: c => /\bif\b[^\n]*\bin\b/.test(stripStrings(c.src)) },
      { label: 'Номер деталі перетворено на число: int()', fn: c => count(c.src, 'int') >= 1 },
      { label: 'Правильна відповідь про деталь', fn: c => lastLine(c) === (nums(c.inputs[0]).includes(Number(c.inputs[1])) ? 'Деталь є на складі' : 'Деталі немає') },
    ],
    otherDataLabel: 'Працює для інших деталей',
    hints: [
      '<code>x in a</code> дає <code>True</code>, якщо значення x є у списку a. Номер потрібної деталі теж перетвори на число — інакше текст <code>\'33\'</code> не знайдеться серед чисел.',
      "<code>x = int(input('Потрібна деталь > '))\nif x in a:\n    print('Деталь є на складі')\nelse:\n    print('Деталі немає')</code>",
    ],
    solution: "a = list(map(int, input('Номери деталей > ').split()))\nx = int(input('Потрібна деталь > '))\nif x in a:\n    print('Деталь є на складі')\nelse:\n    print('Деталі немає')",
    wrong: [
      "a = list(map(int, input('Номери деталей > ').split()))\nx = input('Потрібна деталь > ')\nif x in a:\n    print('Деталь є на складі')\nelse:\n    print('Деталі немає')",
      "a = list(map(int, input('Номери деталей > ').split()))\nx = int(input('Потрібна деталь > '))\nprint('Деталь є на складі')",
      "a = list(map(int, input('Номери деталей > ').split()))\nx = int(input('Потрібна деталь > '))\nif x not in a:\n    print('Деталь є на складі')\nelse:\n    print('Деталі немає')",
    ],
    learned: 'x in a перевіряє, чи є значення у списку, і дає True або False — тому його зручно писати в умові if.',
  },
  {
    id: 'radar', name: 'Радар', topic: 'Прапорець і break', slide: '11', kind: 'code',
    story: 'Радар бачить астероїди навколо станції. Якщо хоча б один ближчий за безпечну відстань — треба вмикати тривогу.',
    task: 'Уводяться відстані до астероїдів (одним рядком) і безпечна відстань. Якщо хоч одна відстань менша за безпечну, виведи <b>Тривога!</b>, інакше — <b>Шлях вільний</b>. Використай змінну-прапорець і <code>break</code>; функцію <code>min()</code> не бери.',
    expected: [['Відстані > ', 'out'], ['120 85 40 300', 'in'], ['\nБезпечна відстань > ', 'out'], ['50', 'in'], ['\nТривога!', 'out']],
    tests: [{ inputs: ['120 85 40 300', '50'] }, { inputs: ['120 85 70 300', '50'] }, { inputs: ['30', '100'] }],
    inputsNote: 'Під час перевірки програма отримає відстані <b>120 85 40 300</b> і безпечну відстань <b>50</b>, а потім ще два набори.',
    starter: "a = list(map(int, input('Відстані > ').split()))\nx = int(input('Безпечна відстань > '))\n",
    checks: [
      { label: 'Є прапорець: f = False до циклу, f = True, коли знайдено', fn: c => /=\s*False\b/.test(stripStrings(c.src)) && /=\s*True\b/.test(stripStrings(c.src)) },
      { label: 'Пошук зупинено командою break, без min()', fn: c => /\bbreak\b/.test(stripStrings(c.src)) && count(c.src, 'min') === 0 },
      { label: 'Правильний висновок радара', fn: c => lastLine(c) === (nums(c.inputs[0]).some(d => d < Number(c.inputs[1])) ? 'Тривога!' : 'Шлях вільний') },
    ],
    otherDataLabel: 'Працює для інших відстаней',
    hints: [
      'До циклу <code>f = False</code> — небезпечного ще не знайдено. У циклі, щойно знайдеш відстань, меншу за x, — <code>f = True</code> і <code>break</code>: далі шукати не треба. Висновок роби після циклу.',
      "<code>f = False\nfor i in range(len(a)):\n    if a[i] &lt; x:\n        f = True\n        break\nif f:\n    print('Тривога!')\nelse:\n    print('Шлях вільний')</code>",
    ],
    solution: "a = list(map(int, input('Відстані > ').split()))\nx = int(input('Безпечна відстань > '))\nf = False\nfor i in range(len(a)):\n    if a[i] < x:\n        f = True\n        break\nif f:\n    print('Тривога!')\nelse:\n    print('Шлях вільний')",
    wrong: [
      "a = list(map(int, input('Відстані > ').split()))\nx = int(input('Безпечна відстань > '))\nif min(a) < x:\n    print('Тривога!')\nelse:\n    print('Шлях вільний')",
      "a = list(map(int, input('Відстані > ').split()))\nx = int(input('Безпечна відстань > '))\nfor i in range(len(a)):\n    if a[i] < x:\n        print('Тривога!')\n    else:\n        print('Шлях вільний')",
      "a = list(map(int, input('Відстані > ').split()))\nx = int(input('Безпечна відстань > '))\nf = False\nfor i in range(len(a)):\n    if a[i] < x:\n        f = True\n        break\nprint('Тривога!')",
    ],
    learned: 'Прапорець f = False до циклу, f = True і break, коли знайдено, а висновок — після циклу: так шукають хоча б один потрібний елемент.',
  },
  {
    id: 'ops-quiz', name: 'Бортовий довідник', topic: 'Операції, функції, методи', slide: '5–21, 31', kind: 'choice',
    story: 'Новий член екіпажу складає іспит з опрацювання списків. Допоможи йому — відповідай на запитання довідника.',
    items: [
      { q: 'Що означає a[-1]?', options: ['Перший елемент списку', 'Останній елемент списку', 'Помилку: індекс не буває від’ємним', 'Елемент перед першим'], answer: 1,
        explain: 'Від’ємні індекси рахують з кінця: a[-1] — це те саме, що a[len(a) - 1].' },
      { q: 'Чи входить у зріз a[i:j] елемент з індексом j?', options: ['Так, завжди', 'Лише коли j від’ємне', 'Ні — зріз закінчується перед ним', 'Лише коли є крок step'], answer: 2,
        explain: 'Елемент з індексом i входить, а з індексом j — ні: a[2:6] бере елементи 2, 3, 4 і 5.' },
      { q: 'Що стається зі списками a і b після c = a + b?', options: ['Вони не змінюються — c є новим списком', 'Елементи b дописуються в кінець a', 'Обидва стають порожніми', 'До кожного елемента a додається елемент b'], answer: 0,
        explain: 'Операції + і * створюють новий список, а старі лишаються такими самими.' },
      { q: 'Чим відрізняються методи remove і pop?', options: ['Нічим — це одне й те саме', 'remove видаляє останній елемент, pop — перший', 'remove очищує весь список, pop — один елемент', 'remove видаляє за значенням, pop — за індексом і повертає видалене'], answer: 3,
        explain: 'a.remove(4) видаляє перше значення 4, а x = a.pop(2) видаляє елемент з індексом 2 і кладе його в x.' },
      { q: 'Коли a.index(x) завершується помилкою і як цього уникнути?', options: ['Коли x немає у списку — спершу перевірити if x in a', 'Коли x трапляється двічі — спершу прибрати повтори', 'Ніколи: якщо x немає, index повертає -1', 'Коли список довгий — розбити його на частини'], answer: 0,
        explain: 'Якщо значення немає, index дає ValueError. Перевірка if x in a захищає від цієї помилки.' },
      { q: 'Що таке логічна змінна-прапорець?', options: ['Команда, що зупиняє цикл', 'Змінна True/False, яка запам’ятовує, чи знайдено потрібний елемент', 'Список, у який збирають знайдені елементи', 'Номер останнього переглянутого елемента'], answer: 1,
        explain: 'До циклу f = False, коли знайшли — f = True. Після циклу за значенням f роблять висновок. Цикл зупиняє break, а не прапорець.' },
    ],
    learned: 'Від’ємні індекси рахують з кінця, зріз не включає елемент j, + і * створюють новий список, index — лише після перевірки in.',
  },
  {
    id: 'one-pass', name: 'Сонячні панелі', topic: 'Max і min за один перегляд', slide: '18–19', kind: 'code',
    story: 'Сонячні панелі то гріються на сонці, то холонуть у тіні. Знайди найвищу й найнижчу температуру та різницю між ними — за один прохід списку.',
    task: 'Одним циклом знайди найбільшу й найменшу температуру в списку <code>a</code> і виведи в одному рядку: найбільшу, найменшу і різницю між ними. Функції <code>max()</code> і <code>min()</code> не використовуй — збудуй їх сам.',
    expected: '25 -15 40',
    starter: 'a = [12, -7, 25, 3, -15, 18, 9, -4]\nmaximum = a[0]\nminimum = a[0]\n',
    checks: [
      { label: 'Елементи перебирає цикл for з порівнянням if', fn: c => /\bfor\b[\s\S]*\bif\b/.test(stripStrings(c.src)) },
      { label: 'Без max(), min() і без готової відповіді', fn: c => count(c.src, 'max') === 0 && count(c.src, 'min') === 0 && !c.src.includes('40') },
      { label: 'Виведено 25 -15 40', fn: outIs('25 -15 40'), diff: '25 -15 40' },
    ],
    hints: [
      'Починаємо з першого елемента: він поки й найбільший, і найменший. Далі в циклі з номера 1 порівнюй кожен елемент: більший за maximum — запам’ятай як maximum, менший за minimum — як minimum.',
      '<code>for i in range(1, len(a)):\n    if a[i] > maximum:\n        maximum = a[i]\n    elif a[i] &lt; minimum:\n        minimum = a[i]\nprint(maximum, minimum, maximum - minimum)</code>',
    ],
    solution: 'a = [12, -7, 25, 3, -15, 18, 9, -4]\nmaximum = a[0]\nminimum = a[0]\nfor i in range(1, len(a)):\n    if a[i] > maximum:\n        maximum = a[i]\n    elif a[i] < minimum:\n        minimum = a[i]\nprint(maximum, minimum, maximum - minimum)',
    wrong: [
      'a = [12, -7, 25, 3, -15, 18, 9, -4]\nprint(max(a), min(a), max(a) - min(a))',
      'a = [12, -7, 25, 3, -15, 18, 9, -4]\nfor i in range(1):\n    print(25, -15, 40)',
      'a = [12, -7, 25, 3, -15, 18, 9, -4]\nmaximum = a[0]\nminimum = a[0]\nfor i in range(1, len(a)):\n    if a[i] > maximum:\n        maximum = a[i]\nprint(maximum, minimum, maximum - minimum)',
    ],
    learned: 'Найбільше й найменше знаходять за один перегляд: беремо a[0] і в циклі замінюємо, коли трапляється більше чи менше значення.',
  },
  {
    id: 'cargo-bay', name: 'Вантажний відсік', topic: 'Методи: insert, remove, pop, count', slide: '20–21', kind: 'code',
    story: 'Прибув вантажний корабель. Черга контейнерів у відсіку змінюється — керуй нею методами списку, не переписуючи список заново.',
    task: 'У списку <code>a</code> — маси контейнерів у черзі. По черзі:<br>1. Терміновий контейнер масою 50 постав на початок черги: <code>insert</code>.<br>2. Прибери пошкоджений контейнер масою 40: <code>remove</code>.<br>3. Розвантаж останній контейнер (<code>pop</code>) і виведи його масу.<br>4. Виведи, скільки в черзі контейнерів масою 20 (<code>count</code>).<br>5. Виведи весь список.',
    expected: '15\n2\n[50, 20, 35, 20]',
    starter: 'a = [20, 35, 40, 20, 15]\n',
    checks: [
      { label: 'Використано методи insert, remove, pop і count', fn: c => ['insert', 'remove', 'pop', 'count'].every(m => count(c.src, m) >= 1) },
      { label: 'Список не переписано заново, виведено print(a)', fn: c => (stripStrings(c.src).match(/(^|\n)\s*a\s*=\s*\[/g) || []).length === 1 && /\bprint\(\s*a\s*\)/.test(stripStrings(c.src)) },
      { label: 'Виведено 15, 2 і [50, 20, 35, 20]', fn: outIs('15\n2\n[50, 20, 35, 20]'), diff: '15\n2\n[50, 20, 35, 20]' },
    ],
    hints: [
      'Методи викликають через крапку: <code>a.insert(індекс, значення)</code> вставляє, <code>a.remove(значення)</code> видаляє за значенням, <code>a.pop()</code> видаляє останній і повертає його, <code>a.count(значення)</code> рахує.',
      '<code>a.insert(0, 50)\na.remove(40)\nx = a.pop()\nprint(x)\nprint(a.count(20))\nprint(a)</code>',
    ],
    solution: 'a = [20, 35, 40, 20, 15]\na.insert(0, 50)\na.remove(40)\nx = a.pop()\nprint(x)\nprint(a.count(20))\nprint(a)',
    wrong: [
      'a = [20, 35, 40, 20, 15]\nprint(15)\nprint(2)\na = [50, 20, 35, 20]\nprint(a)',
      'a = [20, 35, 40, 20, 15]\na.insert(0, 50)\na.remove(40)\nx = a.pop(0)\nprint(x)\nprint(a.count(20))\nprint(a)',
      'a = [20, 35, 40, 20, 15]\na.insert(1, 50)\na.remove(40)\nx = a.pop()\nprint(x)\nprint(a.count(20))\nprint(a)',
    ],
    learned: 'insert вставляє, remove видаляє за значенням, pop — за індексом (без нього — останній), count рахує; ці методи змінюють сам список.',
  },
  {
    id: 'ops-repair', name: 'Ремонтний док', topic: 'Типові помилки', slide: '21, 30', kind: 'code',
    story: 'У програмах ремонтного доку закралися помилки з опрацювання списків. Полагодь п’ять програм — кожну запусти й виправ.',
    steps: [
      { task: 'Програма має вивести перші три заміри — <b>[3, 9, 1]</b>.', expected: '[3, 9, 1]', starter: 'a = [3, 9, 1, 7, 5]\nprint(a[0:2])\n',
        hint: 'Помилки немає, але замірів лише два: елемент з індексом j у зріз a[i:j] не входить.', solution: 'a = [3, 9, 1, 7, 5]\nprint(a[0:3])' },
      { task: 'Програма шукає номер значення t. Якщо такого значення немає, вона має вивести <b>Значення немає</b>.', expected: 'Значення немає', starter: 'a = [3, 9, 1, 7, 5]\nt = 4\nprint(a.index(t))\n',
        hint: 'index дає ValueError, коли значення немає у списку. Спершу перевір: if t in a, а в else виведи повідомлення.', solution: "a = [3, 9, 1, 7, 5]\nt = 4\nif t in a:\n    print(a.index(t))\nelse:\n    print('Значення немає')" },
      { task: 'Програма має вивести найкращий час забігу — <b>8.1</b>.', expected: '8.1', starter: "t = list(map(int, '8.4 8.1 9.0'.split()))\nprint(min(t))\n",
        hint: 'int() не перетворює дробове число з тексту: ValueError. Для дробових чисел — float.', solution: "t = list(map(float, '8.4 8.1 9.0'.split()))\nprint(min(t))" },
      { task: 'Програма має вивести найкращий час забігу — <b>8.1</b>, але виводить інший.', expected: '8.1', starter: 't = [8.4, 8.1, 9.0]\nbest = max(t)\nprint(best)\n',
        hint: 'Помилки немає, але в бігу найкращий час — найменший, а не найбільший.', solution: 't = [8.4, 8.1, 9.0]\nbest = min(t)\nprint(best)' },
      { task: 'Програма рахує середню від’ємну температуру. Якщо від’ємних немає, вона має вивести <b>Від’ємних немає</b>.', expected: 'Від’ємних немає', starter: 'a = [3, 4, 2]\nb = []\nfor x in a:\n    if x < 0:\n        b.append(x)\nprint(sum(b) / len(b))\n',
        hint: 'Список b порожній, тож len(b) дорівнює 0, а ділити на нуль не можна: ZeroDivisionError. Перевір if len(b) > 0.', solution: "a = [3, 4, 2]\nb = []\nfor x in a:\n    if x < 0:\n        b.append(x)\nif len(b) > 0:\n    print(sum(b) / len(b))\nelse:\n    print('Від’ємних немає')" },
    ],
    learned: 'Зріз не включає елемент j, index — лише після перевірки in, дробові числа — через float, а перед діленням на len(b) перевір, що список не порожній.',
  },
  {
    id: 'ops-decoder', name: 'Сейф капітана', topic: 'Що виведе програма?', slide: '26', kind: 'choice',
    story: 'Сейф капітана відчиняється, лише коли передбачиш, що виведе кожна програма. А потім подивишся, що виведе справжній Python.',
    items: [
      { code: 'a = [3, 9, 1, 7, 5]\nprint(a[-2])', options: ['7', '9', '5', '1'], answer: 0, codeOpts: true,
        explain: 'a[-1] — останній елемент (5), тож a[-2] — передостанній: 7.' },
      { code: 'a = [3, 9, 1, 7, 5]\nprint(a[1:3])', options: ['[9, 1, 7]', '[9, 1]', '[3, 9, 1]', '[9]'], answer: 1, codeOpts: true,
        explain: 'Зріз бере елементи з індексами 1 і 2, а елемент з індексом 3 не входить.' },
      { code: 'a = [3, 9, 1, 7, 5]\nprint(a[::-1])', options: ['[3, 9, 1, 7, 5]', '[9, 7, 5, 3, 1]', '[5, 7, 1, 9, 3]', '[1, 3, 5, 7, 9]'], answer: 2, codeOpts: true,
        explain: 'Крок -1 перебирає список справа наліво — список перевертається, а не впорядковується.' },
      { code: 'a = [3, 9, 1, 7, 5]\nprint(sum(a), max(a) - min(a))', options: ['25 8', '25 4', '5 8', '25 -8'], answer: 0, codeOpts: true,
        explain: 'Сума 3 + 9 + 1 + 7 + 5 = 25, найбільше 9, найменше 1, різниця 8.' },
      { code: 'a = [3, 9, 1, 7, 5]\nprint(7 in a, a.index(7))', options: ['True 4', '7 3', 'True 3', 'False 3'], answer: 2, codeOpts: true,
        explain: 'Значення 7 у списку є, тож in дає True. Номери починаються з 0, тому index повертає 3.' },
      { code: 'print([0] * 3 + [1])', options: ['[0, 1, 0, 1, 0, 1]', '[0, 0, 0, 1]', '[3, 1]', '[0, 0, 0, 3]'], answer: 1, codeOpts: true,
        explain: 'Спершу * повторює список [0] тричі, потім + дописує [1] у кінець.' },
    ],
    learned: 'Індекси з кінця, зрізи, in, index, sum, max, min, + і * — тепер ти передбачаєш їхній результат до запуску.',
  },
  {
    id: 'crew-marks', name: 'Атестація екіпажу', topic: 'Практична 4-1: оцінки', slide: '27', kind: 'code',
    story: 'Курсант склав вісім заліків з льотної підготовки. Бортовий комп’ютер має порахувати середню оцінку і скільки оцінок вищі за 7.',
    task: 'Уведи 8 оцінок одним рядком (цілі числа). Виведи два рядки: <b>Середня оцінка: …</b> (округли до десятих: <code>round(…, 1)</code>) і <b>Вищих за 7: …</b> — кількість порахуй лічильником у циклі.',
    expected: [['Оцінки > ', 'out'], ['7 9 10 6 8 11 7 9', 'in'], ['\nСередня оцінка: 8.4\nВищих за 7: 5', 'out']],
    tests: [{ inputs: ['7 9 10 6 8 11 7 9'] }, { inputs: ['12 10 11 9 12 8 10 11'] }, { inputs: ['4 6 7 8 5 3 7 3'] }],
    inputsNote: 'Під час перевірки програма отримає оцінки <b>7 9 10 6 8 11 7 9</b>, а потім ще два набори по вісім оцінок.',
    starter: '',
    checks: [
      { label: 'Середню обчислено: sum(a) / len(a), round()', fn: c => count(c.src, 'sum') >= 1 && count(c.src, 'round') >= 1 },
      { label: 'Оцінки вищі за 7 пораховано лічильником у циклі', fn: c => /\bfor\b[\s\S]*\bif\b[^\n]*>\s*7/.test(stripStrings(c.src)) },
      { label: 'Виведено середню й кількість оцінок, вищих за 7', fn: c => { const a = nums(c.inputs[0]); const avg = Math.round(a.reduce((s, x) => s + x, 0) / a.length * 10) / 10; return tail(c, 2) === 'Середня оцінка: ' + pyFloat(avg) + '\nВищих за 7: ' + a.filter(x => x > 7).length; } },
    ],
    otherDataLabel: 'Працює для інших оцінок',
    hints: [
      'Уведення — <code>list(map(int, input(…).split()))</code>, середня — <code>sum(a) / len(a)</code>. Лічильник: до циклу <code>k = 0</code>, а в циклі <code>k += 1</code>, коли оцінка більша за 7.',
      "<code>sr = round(sum(a) / len(a), 1)\nk = 0\nfor x in a:\n    if x > 7:\n        k += 1\nprint('Середня оцінка:', sr)\nprint('Вищих за 7:', k)</code>",
    ],
    solution: "a = list(map(int, input('Оцінки > ').split()))\nsr = round(sum(a) / len(a), 1)\nk = 0\nfor x in a:\n    if x > 7:\n        k += 1\nprint('Середня оцінка:', sr)\nprint('Вищих за 7:', k)",
    wrong: [
      "a = list(map(int, input('Оцінки > ').split()))\nsr = sum(a) / len(a)\nk = 0\nfor x in a:\n    if x > 7:\n        k += 1\nprint('Середня оцінка:', sr)\nprint('Вищих за 7:', k)",
      "a = list(map(int, input('Оцінки > ').split()))\nsr = round(sum(a) / len(a), 1)\nk = 0\nfor x in a:\n    if x >= 7:\n        k += 1\nprint('Середня оцінка:', sr)\nprint('Вищих за 7:', k)",
      "a = list(map(int, input('Оцінки > ').split()))\nsr = round(sum(a) / len(a), 1)\nfor x in a:\n    if x > 7:\n        pass\nprint('Середня оцінка:', sr)\nprint('Вищих за 7: 5')",
    ],
    learned: 'Середнє — sum(a) / len(a), а кількість елементів за умовою рахує лічильник: k = 0 до циклу і k += 1 в if.',
  },
  {
    id: 'sprint', name: 'Стадіон станції', topic: 'Практична 4-2: змагання', slide: '28', kind: 'code',
    story: 'На стадіоні станції — забіг на 60 метрів. Суддівський комп’ютер має підбити підсумки і сказати, чи впав рекорд станції.',
    task: 'Уведи час учасників одним рядком (дробові числа), потім — рекорд станції. Виведи три рядки:<br><b>Найбільший: … Найменший: …</b><br><b>Спортсменів з найкращим часом: …</b><br><b>Рекорд оновлено!</b> — якщо найкращий час менший за рекорд, інакше <b>Рекорд не оновлено</b>.',
    expected: [['Час учасників > ', 'out'], ['8.4 8.1 9.0 8.1 8.7', 'in'], ['\nРекорд > ', 'out'], ['8.2', 'in'], ['\nНайбільший: 9.0 Найменший: 8.1\nСпортсменів з найкращим часом: 2\nРекорд оновлено!', 'out']],
    tests: [{ inputs: ['8.4 8.1 9.0 8.1 8.7', '8.2'] }, { inputs: ['9.5 8.9 10.2', '8.2'] }, { inputs: ['7.9 8.3 7.9 7.9', '8.0'] }],
    inputsNote: 'Під час перевірки програма отримає час <b>8.4 8.1 9.0 8.1 8.7</b> і рекорд <b>8.2</b>, а потім ще два забіги.',
    starter: '',
    checks: [
      { label: 'Час уведено дробовими числами: map(float, …)', fn: c => /\bmap\(\s*float\b/.test(stripStrings(c.src)) },
      { label: 'Використано max(), min() і count()', fn: c => ['max', 'min', 'count'].every(f => count(c.src, f) >= 1) },
      { label: 'Виведено правильні підсумки забігу', fn: c => {
        const t = nums(c.inputs[0]), best = Math.min(...t);
        return tail(c, 3) === 'Найбільший: ' + pyFloat(Math.max(...t)) + ' Найменший: ' + pyFloat(best) + '\nСпортсменів з найкращим часом: ' + t.filter(x => x === best).length + '\n' + (best < Number(c.inputs[1]) ? 'Рекорд оновлено!' : 'Рекорд не оновлено');
      } },
    ],
    otherDataLabel: 'Працює для інших забігів',
    hints: [
      'У бігу найкращий час — найменший: <code>min(t)</code>. Скільки разів він трапляється, порахує <code>t.count(min(t))</code>. Рекорд — теж дробове число: <code>float(input(…))</code>.',
      "<code>print('Найбільший:', max(t), 'Найменший:', min(t))\nprint('Спортсменів з найкращим часом:', t.count(min(t)))\nif min(t) &lt; rec:\n    print('Рекорд оновлено!')\nelse:\n    print('Рекорд не оновлено')</code>",
    ],
    solution: "t = list(map(float, input('Час учасників > ').split()))\nrec = float(input('Рекорд > '))\nprint('Найбільший:', max(t), 'Найменший:', min(t))\nprint('Спортсменів з найкращим часом:', t.count(min(t)))\nif min(t) < rec:\n    print('Рекорд оновлено!')\nelse:\n    print('Рекорд не оновлено')",
    wrong: [
      "t = list(map(float, input('Час учасників > ').split()))\nrec = float(input('Рекорд > '))\nprint('Найбільший:', max(t), 'Найменший:', min(t))\nprint('Спортсменів з найкращим часом:', t.count(max(t)))\nif max(t) < rec:\n    print('Рекорд оновлено!')\nelse:\n    print('Рекорд не оновлено')",
      "t = list(map(float, input('Час учасників > ').split()))\nrec = float(input('Рекорд > '))\nprint('Найбільший:', max(t), 'Найменший:', min(t))\nprint('Спортсменів з найкращим часом:', t.count(8.1))\nif min(t) < rec:\n    print('Рекорд оновлено!')\nelse:\n    print('Рекорд не оновлено')",
      "t = list(map(float, input('Час учасників > ').split()))\nrec = float(input('Рекорд > '))\nprint('Найбільший:', max(t), 'Найменший:', min(t))\nprint('Спортсменів з найкращим часом:', t.count(min(t)))\nprint('Рекорд оновлено!')",
    ],
    learned: 'max, min і count разом з умовою if підбивають підсумки будь-якого списку — скільки б у ньому не було значень.',
  },
];

const examples: [string, string][] = [
  ['Індекси з кінця', "a = [-2, 4, 5, 7, 0, 15]\nprint(a[-1], a[-2], a[-3])\nprint(a[len(a) - 1])\n"],
  ['Об’єднання й повторення', "a = [2, 4, 6, 8]\nb = [10, 12]\nprint(a + b)\nprint([2, 4, 6] * 3)\nprint([0] * 10)\n"],
  ['Зрізи', "a = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\nprint(a[2:6])\nprint(a[1:8:2])\nprint(a[:3], a[4:])\nprint(a[::-1])\nprint(a[-4:-1])\n"],
  ['Операція in', "a = [9, 11, 7, 11]\nprint(7 in a, 3 in a, 3 not in a)\nif 3 in a:\n    print('Оцінка 3 є')\nelse:\n    print('Оцінки 3 немає')\n"],
  ['Прапорець і break', "a = [9, 11, 7, 11]\nx = 10\nf = False\nfor i in range(len(a)):\n    if a[i] > x:\n        f = True\n        break\nif f:\n    print('Такі оцінки є')\nelse:\n    print('Таких оцінок немає')\n"],
  ['sum, min, max', "a = [2, 12, -5, 7, 4]\nprint(sum(a), min(a), max(a), len(a))\nprint('Середнє:', sum(a) / len(a))\nprint('Розмах:', max(a) - min(a))\n"],
  ['Методи списків', "a = [2, 4, 6, 8, 4]\nprint(a.count(4), a.index(4))\na.insert(1, 3)\na.remove(4)\nx = a.pop(2)\nprint(x, a)\na.clear()\nprint(a)\n"],
];

const lesson: Lesson = {
  id: 'list-ops',
  title: 'Опрацювання списків',
  missions,
  examples,
  certificate: {
    ranks: [
      { from: 0.9, title: 'Командир обчислювального центру' },
      { from: 0.67, title: 'Навігатор даних' },
      { from: 0, title: 'Курсант-аналітик' },
    ],
    summary: 'Ти вмієш брати елементи з кінця, вирізати частини списку зрізами, шукати значення операцією in і прапорцем, знаходити найбільше й найменше та змінювати список методами.',
    next: 'Наступного уроку — сортування й пошук даних у списках.',
  },
};
export default lesson;
