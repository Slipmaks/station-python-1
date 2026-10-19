<script lang="ts">
	import { tick } from 'svelte';
	import type { TypeKey, TypesMission } from '#lib/types.js';
	import { TYPE_INFO } from '#lib/lessons/pytypes.js';
	import { typesStars } from '#lib/grade.js';
	import { complete, logAttempt, ui } from '#lib/state.svelte.js';
	import BriefHead from './BriefHead.svelte';

	let { m, i }: { m: TypesMission; i: number } = $props();

	const TYPES = Object.keys(TYPE_INFO) as TypeKey[];
	let items = $state.raw<[string, TypeKey][]>([]);
	let k = $state(0), right = $state(0);
	let picked = $state<TypeKey | null>(null);
	let failed = $state(false);
	let nextBtn = $state<HTMLButtonElement>();
	const [val, ans] = $derived(items[k] ?? ['', 'int']);
	const last = $derived(k === items.length - 1);
	const cls = (v: string) => (v.startsWith("'") ? 's' : v === 'True' || v === 'False' ? 'b' : 'n');

	function start() {
		items = m.pool.slice().sort(() => Math.random() - 0.5).slice(0, m.count);
		k = 0; right = 0; picked = null; failed = false;
	}
	start();

	async function pick(t: TypeKey) {
		if (picked) return;
		picked = t;
		logAttempt({ missionId: m.id, step: k, answer: `${val} → ${t}` });
		if (t === ans) right++;
		await tick(); nextBtn?.focus();
	}
	function next() {
		if (!last) { k++; picked = null; return; }
		if (right >= m.pass) complete(i, typesStars(right, m.count));
		else failed = true;
	}
	// Цифри 1–4 вибирають тип, де б не був фокус (крім полів введення й модальних вікон).
	function keys(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement).tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || ui.modal || failed) return;
		if (/^[1-4]$/.test(e.key)) pick(TYPES[+e.key - 1]);
	}
</script>

<svelte:window onkeydown={keys} />

<div class="quiz">
	<BriefHead {m} />
	<div class="task" style="margin-bottom:6px">{@html m.task}</div>
	<div class="quiz-top">
		<div class="qdots">{#each items as _, j (j)}<i class:ok={j < k} class:cur={j === k}></i>{/each}</div>
		<span class="mtopic">Контейнер {k + 1} з {m.count} · правильно: {right}</span>
	</div>
	<div class="qcard">
		{#if failed}
			<h2 style="font-size:24px;margin-bottom:8px">Правильно {right} з {m.count}</h2>
			<p>Для відновлення відсіку потрібно щонайменше {m.pass}. Згадай: лапки → str, крапка → float, True/False → bool, ціле без крапки → int.</p>
			<div class="qnext"><button class="btn amber" type="button" onclick={start}>Сканувати ще раз</button></div>
		{:else}
			<div class="scan-value"><span class={cls(val)}>{val}</span></div>
			<div class="types">
				{#each TYPES as t, j (t)}
					<button
						class="tbtn"
						class:right={picked && t === ans}
						class:wrong={picked === t && t !== ans}
						type="button"
						disabled={!!picked}
						onclick={() => pick(t)}><b>{t}</b><small>{j + 1} · {TYPE_INFO[t].sub}</small></button>
				{/each}
			</div>
			<div class="qfeed" aria-live="polite">
				{#if picked}
					<div class="verdict {picked === ans ? 'good' : 'bad'}">{picked === ans ? 'Так! ' : `Ні, це ${ans}. `}{TYPE_INFO[ans].why}</div>
				{/if}
			</div>
			<div class="qnext">
				{#if picked}<button class="btn" type="button" bind:this={nextBtn} onclick={next}>{last ? 'Підсумок' : 'Наступний контейнер'}</button>{/if}
			</div>
		{/if}
	</div>
</div>
