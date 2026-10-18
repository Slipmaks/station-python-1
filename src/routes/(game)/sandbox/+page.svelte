<script lang="ts">
	import { Py, type RunResult } from '#lib/py.js';
	import { lesson } from '#lib/lessons/index.js';
	import { S, save } from '#lib/state.svelte.js';
	import Editor from '#lib/components/Editor.svelte';
	import Console from '#lib/components/Console.svelte';

	type Entry = { kind: 'program'; res: RunResult; src: string; inputs: string[] } | { kind: 'repl'; line: string; res: RunResult };

	let code = $state(S.code.__sandbox ?? lesson.examples[0][1]);
	let entries = $state.raw<Entry[]>([]);
	let placeholder = $state(true);
	let editor: Editor;
	let consoleEl: HTMLDivElement;
	// Змінні оболонки: спершу з останнього запуску програми, далі їх змінює рядок >>>. Не реактивне — його мутує інтерпретатор.
	let replEnv: Record<string, unknown> = Object.create(null);
	const hist: string[] = [];
	let hi = 0;

	$effect(() => { void entries; consoleEl.scrollTop = consoleEl.scrollHeight; });

	function setCode(v: string) { code = v; S.code.__sandbox = v; save(); }

	/** Програма з input() перезапускається з початку з усіма введеними досі значеннями.
	 *  Записи консолі мають ключ — сам об’єкт, тож кожен запуск отримує нове порожнє поле введення з фокусом. */
	function runProgram(src: string, inputs: string[]) {
		const res = Py.run(src, { inputs });
		replEnv = res.env;
		entries = [{ kind: 'program', res, src, inputs }];
		placeholder = false;
	}

	function pickExample(e: Event & { currentTarget: HTMLSelectElement }) {
		const v = e.currentTarget.value;
		if (v === '') return;
		setCode(lesson.examples[+v][1]);
		e.currentTarget.value = '';
		editor.focus();
	}

	function replKey(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		const inp = e.currentTarget;
		if (e.key === 'ArrowUp') { if (hi > 0) inp.value = hist[--hi]; e.preventDefault(); return; }
		if (e.key === 'ArrowDown') { if (hi < hist.length) inp.value = hist[++hi] || ''; e.preventDefault(); return; }
		if (e.key !== 'Enter') return;
		const line = inp.value;
		if (!line.trim()) return;
		hist.push(line); hi = hist.length; inp.value = '';
		if (placeholder) { entries = []; placeholder = false; }
		entries = [...entries, { kind: 'repl', line, res: Py.run(line, { env: replEnv, repl: true }) }];
	}

	const focusNow = (el: HTMLElement) => el.focus();
</script>

<div class="crumbs"><a class="back" href="/"><span aria-hidden="true">‹</span> До станції</a></div>
<div>
	<h1 class="page-title">Пісочниця</h1>
	<p class="page-sub">Тут можна писати будь-які програми з уроку й експериментувати. У рядку <span class="mono">&gt;&gt;&gt;</span> внизу команди виконуються одразу, як в оболонці IDLE.</p>
</div>
<div class="sandbox">
	<section>
		<div class="ide">
			<div class="ide-bar">
				<div class="dots"><i></i><i></i><i></i></div>
				<span class="ide-title">sandbox.py</span>
				<div class="ide-actions">
					<select class="ghost" aria-label="Приклади з уроку" onchange={pickExample}>
						<option value="">Приклади з уроку…</option>
						{#each lesson.examples as [title], j (j)}<option value={String(j)}>{title}</option>{/each}
					</select>
					<button class="run" type="button" onclick={() => runProgram(code, [])}>Запустити <kbd>F5</kbd></button>
				</div>
			</div>
			<Editor bind:this={editor} bind:value={code} oninput={setCode} onrun={() => runProgram(code, [])} tall />
			<div class="console-head"><span>Оболонка</span><button class="ghost" type="button" onclick={() => { entries = []; placeholder = false; }}>Очистити</button></div>
			<div class="console" aria-live="polite" bind:this={consoleEl}>{#if placeholder}<span class="placeholder">Тут з’явиться результат.</span>{/if}{#each entries as en (en)}{#if en.kind === 'program'}<Console res={en.res} note="=== Запуск програми ===">{#if en.res.needInput}<span class="in-line"><input aria-label="Введення для програми" autocomplete="off" spellcheck="false" {@attach focusNow} onkeydown={e => { if (e.key === 'Enter') { e.preventDefault(); runProgram(en.src, [...en.inputs, e.currentTarget.value]); } }} /></span>{/if}</Console>{:else}<div><div><span class="prompt">&gt;&gt;&gt;{' '}</span>{en.line}</div><div>{#if en.res.needInput}<span class="sys">У рядку &gt;&gt;&gt; input() не працює — напиши програму в редакторі й запусти її.</span>{:else}<Console res={en.res} quietEmpty />{/if}</div></div>{/if}{/each}</div>
			<label class="repl"><span class="prompt">&gt;&gt;&gt;</span><input aria-label="Команда для оболонки" placeholder="наприклад, 7 * 6" autocomplete="off" spellcheck="false" onkeydown={replKey} /></label>
		</div>
	</section>
	<aside class="sheet">
		<h3>Шпаргалка</h3>
		<dl>
			<dt>print(...)</dt><dd>вивести на екран</dd>
			<dt>input('...')</dt><dd>запитати дані (завжди рядок)</dd>
			<dt>int(...) float(...)</dt><dd>перетворити на число</dd>
			<dt>str(...)</dt><dd>перетворити на рядок</dd>
			<dt>type(...)</dt><dd>дізнатися тип значення</dd>
			<dt>+ - * /</dt><dd>додавання, віднімання, множення, ділення</dd>
			<dt>// %</dt><dd>ціла частина й остача від ділення</dd>
			<dt>**</dt><dd>піднесення до степеня</dd>
			<dt>x = 5</dt><dd>покласти значення у змінну</dd>
			<dt>for i in range(n):</dt><dd>повторити n разів (з відступом)</dd>
			<dt># ...</dt><dd>коментар, Python його пропускає</dd>
		</dl>
		<p style="margin-top:12px;color:var(--ink-soft)">Пасхалки: спробуй <span class="mono">import this</span> і <span class="mono">import antigravity</span>.</p>
	</aside>
</div>
