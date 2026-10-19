import { expect, it } from 'vitest';
import { Py } from './py.js';

const out = (src: string) => { const r = Py.run(src); return r.error ? r.error.type : Py.outputText(r); };

it('sort()/sorted(): reverse працює, інші іменовані аргументи — помилка, а не мовчки неправильний результат', () => {
	expect(out('a = [3, 1, 2]\na.sort(reverse=True)\nprint(a)')).toBe('[3, 2, 1]\n');
	expect(out('print(sorted([3, 1, 2], reverse=True))')).toBe('[3, 2, 1]\n');
	expect(out("print(sorted(['bb', 'a', 'c'], key=len))")).toBe('Unsupported');
	expect(out('a = [1]\na.append(x=2)')).toBe('TypeError');
});

it('map() і *a у виклику — як у Python (уроки 14–15: уведення й виведення списків)', () => {
	expect(out("a = list(map(float, '4 5.3'.split()))\nprint(a)\nprint('Площі:', *a)")).toBe('[4.0, 5.3]\nПлощі: 4.0 5.3\n');
	expect(out("a = map(int, ['1', '2'])\nprint(list(a), list(a), type(a))")).toBe("[1, 2] [] <class 'map'>\n");
	expect(out("print(*[1, 2], sep=', ')")).toBe('1, 2\n');
	expect(out('print(*5)')).toBe('TypeError');
	expect(out("print(list(map(int, ['1', 'x'])))")).toBe('ValueError');
});
