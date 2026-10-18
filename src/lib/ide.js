// @ts-nocheck — перенесено з офлайн-версії без змін
/* Підсвітка коду й пояснення помилок для учня. Повертають HTML-рядки. */
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const KW = new Set(['for', 'in', 'while', 'if', 'elif', 'else', 'break', 'continue', 'pass', 'import', 'and', 'or', 'not', 'True', 'False', 'None', 'def', 'return', 'is', 'from', 'as', 'class', 'lambda']);
const BI = new Set(['print', 'input', 'int', 'float', 'str', 'bool', 'type', 'range', 'len', 'abs', 'round', 'min', 'max', 'sum', 'list', 'sorted']);
export function highlight(src) {
  const re = /(#.*$)|('(?:[^'\\\n]|\\.)*'?|"(?:[^"\\\n]|\\.)*"?)|(\b\d[\d_]*(?:\.\d*)?(?:[eE][+-]?\d+)?\b)|([\p{L}_][\p{L}\p{N}_]*)|([^\s\p{L}\p{N}_#'"]+)/gmu;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    const t = m[0];
    if (m[1]) out += `<span class="tk-com">${esc(t)}</span>`;
    else if (m[2]) out += `<span class="tk-str">${esc(t)}</span>`;
    else if (m[3]) out += `<span class="tk-num">${esc(t)}</span>`;
    else if (m[4]) out += (KW.has(t) || BI.has(t)) ? `<span class="tk-kw">${esc(t)}</span>` : esc(t);
    else out += `<span class="tk-op">${esc(t)}</span>`;
    last = m.index + t.length;
  }
  return out + esc(src.slice(last)) + '\n';
}

export function explainError(e, events, src) {
  if (!e) {
    const sh = events && events.find(x => x.type === 'shadow');
    return sh ? `<b>Увага</b>Значення покладено у змінну з ім’ям <code>${esc(sh.name)}</code> — так звуть вбудовану команду, і тепер вона не працює. Обери інше ім’я змінної.` : '';
  }
  const m = e.msg, t = e.type;
  const code = e.code || '';
  if (t === 'NameError') {
    const name = (/name '([^']+)'/.exec(m) || [])[1] || '';
    const dym = (/Did you mean: '([^']+)'/.exec(m) || [])[1];
    if (dym && dym.toLowerCase() === name.toLowerCase()) return `<b>Python не знає імені «${esc(name)}»</b>Великі й малі літери в Python різні. Команду треба писати так: <code>${esc(dym)}</code>.`;
    if (dym) return `<b>Python не знає імені «${esc(name)}»</b>Можливо, тут помилка в написанні і мало бути <code>${esc(dym)}</code>.`;
    return `<b>Python не знає імені «${esc(name)}»</b>Якщо це текст — візьми його в лапки: <code>'${esc(name)}'</code>. Якщо це змінна — перевір, що її створено вище і що ім’я написано так само.`;
  }
  if (t === 'SyntaxError') {
    if (m.startsWith('unterminated string')) {
      if (/\p{L}'\p{L}/u.test(code)) return '<b>Лапки не закрито</b>Схоже, в тексті є апостроф (як у слові «зв’язок»): він закриває рядок раніше, ніж треба. Візьми такий текст у подвійні лапки: <code>"зв\'язок"</code>.';
      return '<b>Лапки не закрито</b>Текст має починатися й закінчуватися однаковими лапками: <code>\'...\'</code> або <code>"..."</code>.';
    }
    if (m.startsWith('invalid character')) return '<b>Незвичний символ</b>Python розуміє лише прямі лапки <code>\'</code> або <code>"</code>. «Ялинки» чи «криві» лапки з’являються, якщо ввімкнено українську розкладку або текст скопійовано з документа. Перемкни розкладку на англійську.';
    if (m.includes('was never closed')) return '<b>Дужку не закрито</b>Кожна відкрита дужка <code>(</code> має свою пару <code>)</code>. Порахуй дужки в рядку.';
    if (m.startsWith('unmatched') || m.startsWith('closing parenthesis')) return '<b>Зайва дужка</b>Закривних дужок більше, ніж відкривних, або вони не до пари.';
    if (m === "expected ':'") return '<b>Бракує двокрапки</b>Заголовок циклу <code>for</code> (а також <code>if</code>) закінчується двокрапкою <code>:</code>.';
    if (m.includes('forgot a comma')) return '<b>Бракує коми</b>Схоже, між значеннями в дужках бракує коми.';
    if (m.includes("cannot assign")) return '<b>Неправильне присвоєння</b>Ліворуч від <code>=</code> має стояти ім’я змінної, а праворуч — значення.';
    if (m.includes("'==' or ':='")) return '<b>= замість ==</b>Для порівняння в умовах пишуть <code>==</code>.';
    if (m.includes('decimal literal')) return '<b>Ім’я не може починатися з цифри</b>Імена змінних починаються з літери або _: <code>x1</code>, а не <code>1x</code>.';
    return '<b>Порушено правила запису</b>Python не розуміє цей рядок. Перевір дужки, лапки, коми й двокрапки.';
  }
  if (t === 'IndentationError') {
    if (m.startsWith('expected an indented block')) return '<b>Потрібен відступ</b>Команди всередині циклу пишуть з відступом 4 пробіли (клавіша Tab). Саме відступ показує, що команда належить циклу.';
    if (m === 'unexpected indent') return '<b>Зайвий відступ</b>Цей рядок починається з пробілів, хоча не належить жодному циклу. Прибери пробіли на початку рядка.';
    return '<b>Відступи не збігаються</b>Рядки одного блоку мають мати однаковий відступ — 4 пробіли.';
  }
  if (t === 'TypeError') {
    if (m.startsWith('can only concatenate str')) return '<b>Текст + число не додаються</b>Значення ліворуч від <code>+</code> — рядок (текст). Якщо воно прийшло з <code>input()</code>, перетвори його на число: <code>int(...)</code>.';
    if (m.startsWith('unsupported operand') && m.includes("'str'")) return '<b>Число і текст не поєднуються</b>Один з доданків — рядок (текст). Перетвори його на число за допомогою <code>int()</code> або <code>float()</code>.';
    if (m.includes('not callable')) return '<b>Це не команда</b>Дужки після імені означають виклик команди, а тут стоїть звичайне значення. Можливо, змінну названо так само, як команду.';
    if (m.includes("can't multiply sequence")) return '<b>Текст можна множити лише на ціле число</b>Наприклад, <code>\'ха\' * 3</code> → хахаха.';
    return '<b>Неправильний тип даних</b>Ця дія не підходить для такого типу значення. Перевір, де число, а де текст.';
  }
  if (t === 'ValueError') {
    if (m.startsWith('invalid literal for int()')) return '<b>Це не ціле число</b><code>int()</code> не може перетворити такий текст на ціле число. Потрібні лише цифри — без пробілів, коми, крапки чи букв.';
    if (m.startsWith('could not convert string to float')) return '<b>Це не число</b><code>float()</code> не може перетворити такий текст на число. Дробову частину відділяй крапкою: 3.5.';
    return '';
  }
  if (t === 'ZeroDivisionError') return '<b>Ділення на нуль</b>На нуль ділити не можна — навіть Python’у.';
  if (t === 'IndexError') return '<b>Такого номера немає</b>Нумерація починається з 0, а останній номер на 1 менший за довжину.';
  return '';
}
