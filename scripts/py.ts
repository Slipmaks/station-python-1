// Запустити Python-код інтерпретатором сайту — так, як його виконає гра (це не справжній Python, він уміє не все):
//   node scripts/py.ts програма.py [введення1 введення2 …]
//   echo "print(2 + 3)" | node scripts/py.ts
// Друкує вивід разом із введеними даними, як у консолі гри; помилку — з поясненням тренажера (код виходу 1).
import { readFileSync } from 'node:fs';
import { Py } from '../src/lib/py.js';

const [file, ...inputs] = process.argv.slice(2);
const res = Py.run(readFileSync(file ?? 0, 'utf8'), { inputs });
process.stdout.write(Py.outputText(res));
if (res.error) console.log(Py.formatError(res.error));
if (res.needInput) console.log('[програма чекає на ще одне введення — допиши значення після імені файлу]');
process.exit(res.error ? 1 : 0);
