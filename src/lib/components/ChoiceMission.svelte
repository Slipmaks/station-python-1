<script lang="ts">
	import { tick } from 'svelte';
	import { Py } from '#lib/py.js';
	import { highlight } from '#lib/ide.js';
	import type { ChoiceMission } from '#lib/types.js';
	import { choiceStars } from '#lib/grade.js';
	import { complete, logAttempt, prog, save } from '#lib/state.svelte.js';
	import BriefHead from './BriefHead.svelte';

	let { m }: { m: ChoiceMission } = $props();

	// svelte-ignore state_referenced_locally — компонент перестворюється через {#key m.id}
	const p = prog(m);
	// svelte-ignore state_referenced_locally — компонент перестворюється через {#key m.id}
	const order = m.items.map(it => it.options.map((_, j) => j).sort(() => Math.random() - 0.5));
	let k = $state(0);
	let wrong = $state<number[]>([]);
	let solved = $state(false);
	let actual = $state<string | null>(null);
	let card: HTMLDivElement, nextBtn = $state<HTMLButtonElement>();
	const it = $derived(m.items[k]);
	const last = $derived(k === m.items.length - 1);

	async function pick(j: number) {
		if (solved || wrong.includes(j)) return;
		logAttempt({ missionId: m.id, step: k, answer: it.options[j] });
		if (j !== it.answer) { wrong.push(j); p.mistakes++; save(); return; }
		solved = true;
		actual = it.code ? Py.outputText(Py.run(it.code)).replace(/\n$/, '') : null;
		await tick(); nextBtn?.focus();
	}
	async function next() {
		if (last) { complete(m, choiceStars(p.mistakes)); return; }
		k++; wrong = []; solved = false; actual = null;
		await tick(); card.querySelector<HTMLButtonElement>('.opt')?.focus();
	}
	function keys(e: KeyboardEvent) {
		if (/^[1-4]$/.test(e.key)) card.querySelectorAll<HTMLButtonElement>('.opt')[+e.key - 1]?.click();
	}
</script>

<div class="quiz">
	<BriefHead {m} />
	<div class="quiz-top">
		<div class="qdots">{#each m.items as _, j (j)}<i class:ok={j < k} class:cur={j === k}></i>{/each}</div>
		<span class="mtopic">Запис {k + 1} з {m.items.length}</span>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="qcard" role="group" bind:this={card} onkeydown={keys}>
		<div class="q">{it.code ? 'Що виведе програма?' : it.q}</div>
		{#if it.code}<pre class="qcode">{@html highlight(it.code).trimEnd()}</pre>{/if}
		<div class="opts">
			{#each order[k] as j, pos (j)}
				<button
					class="opt"
					class:code-opt={it.codeOpts}
					class:wrong={wrong.includes(j)}
					class:right={solved && j === it.answer}
					type="button"
					disabled={solved || wrong.includes(j)}
					onclick={() => pick(j)}><span class="k">{pos + 1}</span><span>{it.options[j]}</span></button>
			{/each}
		</div>
		<div class="qfeed" aria-live="polite">
			{#if solved}
				<div class="verdict good">{it.explain}</div>
				{#if actual !== null}<div class="actual">Справжній Python виводить:<pre class="expected" style="margin-top:6px">{actual}</pre></div>{/if}
			{:else if wrong.length}
				<div class="verdict bad">Ні, не так. Подумай ще раз.</div>
			{/if}
		</div>
		<div class="qnext">
			{#if solved}<button class="btn" type="button" bind:this={nextBtn} onclick={next}>{last ? 'Відновити відсік' : 'Далі'}</button>{/if}
		</div>
	</div>
</div>
