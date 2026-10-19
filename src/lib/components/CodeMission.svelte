<script lang="ts">
	import type { RunResult } from '#lib/py.js';
	import type { CodeMission } from '#lib/types.js';
	import { codeStars, grade, resolveTask, type Verdict } from '#lib/grade.js';
	import { S, complete, logAttempt, prog, save, toast } from '#lib/state.svelte.js';
	import BriefHead from './BriefHead.svelte';
	import Editor from './Editor.svelte';
	import Console from './Console.svelte';

	let { m, i }: { m: CodeMission; i: number } = $props();

	// svelte-ignore state_referenced_locally — компонент перестворюється через {#key m.id}
	const p = prog(m);
	// svelte-ignore state_referenced_locally — компонент перестворюється через {#key m.id}
	const steps = 'steps' in m ? m.steps : null;
	// svelte-ignore state_referenced_locally — компонент перестворюється через {#key m.id}
	let stepIdx = $state(steps ? Math.min(S.step[m.id] || 0, steps.length - 1) : 0);
	const c = $derived(resolveTask(m, stepIdx));
	const codeKey = $derived(steps ? `${m.id}:${stepIdx}` : m.id);

	let code = $state('');
	let res = $state.raw<RunResult | null>(null);
	let placeholder = $state('');
	let checkState = $state.raw<(boolean | null)[]>([]);
	let verdict = $state.raw<Verdict | null>(null);
	let missingInputs = $state(-1); // скільки значень дає тест, якщо програма просить більше; −1 — не просить
	let editor: Editor;
	let consoleEl: HTMLDivElement;

	function loadStep() {
		code = S.code[codeKey] ?? c.starter;
		res = null; checkState = []; verdict = null;
		placeholder = 'Натисни «Запустити», щоб виконати програму.';
	}
	loadStep();

	const labels = $derived([...c.checks.map(x => x.label), ...(c.tests && c.tests.length > 1 ? [c.otherDataLabel ?? ''] : [])]);
	const hintsShown = $derived(p.hints[stepIdx]);
	const fails = $derived(p.fails[stepIdx]);
	const showSol = $derived(fails >= 3 || hintsShown >= c.hints.length);

	$effect(() => { void res; consoleEl.scrollTop = consoleEl.scrollHeight; });

	function setCode(v: string) { code = v; S.code[codeKey] = v; save(); }

	function hint() {
		p.hints[stepIdx]++;
		save();
	}
	function solution() {
		p.sol = true;
		setCode(c.solution + '\n');
		toast('Розв’язок вставлено в редактор. Розберись, як він працює, і натисни «Запустити».');
	}
	function reset() {
		setCode(c.starter);
		res = null; placeholder = 'Код повернуто до початкового.';
		editor.focus();
	}

	function run() {
		const g = grade(c, code);
		logAttempt({ missionId: m.id, step: stepIdx, answer: code, hints: hintsShown, sol: p.sol });
		res = g.res;
		missingInputs = g.res.needInput ? g.inputsCount : -1;
		checkState = g.st;
		verdict = g.verdict;
		if (!g.ok) {
			p.fails[stepIdx]++;
			save();
			return;
		}
		if (steps && stepIdx < steps.length - 1) {
			stepIdx++; S.step[m.id] = stepIdx; save();
			toast(`Програму полагоджено! Залишилось ${steps.length - stepIdx}.`);
			loadStep();
			return;
		}
		complete(i, codeStars(p, !!steps));
	}
</script>

<div class="mission">
	<section class="brief">
		<BriefHead {m} />
		{#if steps}
			<div class="block">
				<h3>Програма {stepIdx + 1} з {steps.length}</h3>
				<div class="qdots">{#each steps as _, k (k)}<i class:ok={k < stepIdx} class:cur={k === stepIdx}></i>{/each}</div>
			</div>
		{/if}
		<div class="block"><h3>Завдання</h3><div class="task">{@html c.task}</div></div>
		<div class="block">
			<h3>Очікуваний результат</h3>
			<pre class="expected">{#if typeof c.expected === 'string'}{c.expected}{:else}{#each c.expected as [t, kind], k (k)}<span class:in={kind === 'in'}>{t}</span>{/each}{/if}</pre>
			{#if c.inputsNote}<div class="inputs-note">{@html c.inputsNote}</div>{/if}
		</div>
		<div class="block">
			<h3>Перевірки</h3>
			<ul class="checks">
				{#each labels as l, k (k)}<li class:ok={checkState[k] === true} class:fail={checkState[k] === false}>{l}</li>{/each}
			</ul>
			{#if verdict?.kind === 'good'}
				<div class="verdict good">Усі перевірки пройдено!</div>
			{:else if verdict?.kind === 'hardcoded'}
				<div class="verdict bad">Для «{verdict.first}» усе працює, а для «{verdict.failed}» — ні. Схоже, значення вписане в програму вручну. Програма має використовувати те, що ввели.</div>
			{:else if verdict?.kind === 'error'}
				<div class="verdict bad">Програма завершилася з помилкою. Пояснення — під результатом у вікні оболонки.</div>
			{:else if verdict?.kind === 'diff'}
				<div class="verdict bad">Результат відрізняється від очікуваного. Порівняй уважно — кожен символ має значення.<div class="diff"><span>Очікувалось:</span><span>{verdict.expected}</span><span>Отримано:</span><span>{verdict.got || '(нічого)'}</span></div></div>
			{:else if verdict?.kind === 'incomplete'}
				<div class="verdict bad">Ще не все виконано — подивись, які перевірки не пройдено.</div>
			{/if}
		</div>
		<div class="block hints">
			<h3>Підказки</h3>
			{#each c.hints.slice(0, hintsShown) as t, k (k)}<div class="hint-text">{@html t}</div>{/each}
			{#if hintsShown < c.hints.length}
				<button class="hint-btn" type="button" onclick={hint}>{hintsShown ? 'Ще одна підказка' : 'Показати підказку'}</button>
			{/if}
			{#if showSol}
				<button class="sol-btn" type="button" onclick={solution}>Показати розв’язок (залишиться 1 зірка)</button>
			{/if}
		</div>
	</section>
	<section class="ide-col">
		<div class="ide">
			<div class="ide-bar">
				<div class="dots"><i></i><i></i><i></i></div>
				<span class="ide-title">main.py</span>
				<div class="ide-actions">
					<button class="ghost" type="button" onclick={reset}>Почати спочатку</button>
					<button class="run" type="button" onclick={run}>Запустити <kbd>F5</kbd></button>
				</div>
			</div>
			<Editor bind:this={editor} bind:value={code} oninput={setCode} onrun={run} />
			<div class="console-head"><span>Оболонка — результат програми</span></div>
			<div class="console" aria-live="polite" bind:this={consoleEl}>{#if res}<Console {res}>{#if missingInputs >= 0}<div class="explain"><b>Програма чекає ще одне введення</b>{#if missingInputs === 0}У цьому завданні нічого вводити не потрібно — прибери <code>input()</code>.{:else}У цьому завданні вводиться лише {missingInputs === 1 ? 'одне значення' : missingInputs + ' значення'}. Перевір, скільки разів у програмі викликається <code>input()</code>.{/if}</div>{/if}</Console>{:else}<span class="placeholder">{placeholder}</span>{/if}</div>
		</div>
	</section>
</div>
