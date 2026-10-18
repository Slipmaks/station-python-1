<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { MISSIONS } from '#lib/lessons/index.js';
	import { S, doneCount, flash, isUnlocked, nextIndex, saveNow, ui } from '#lib/state.svelte.js';
	import Station from '#lib/components/Station.svelte';

	// Анімацію «ввімкнення» відсіку показуємо один раз.
	const lit = flash.justLit;
	flash.justLit = null;

	const n = $derived(doneCount());
	const nx = $derived(nextIndex());
	const status = $derived(
		n === 0 ? `Живлення немає в жодному відсіку. Почни з відсіку «${MISSIONS[0].name}».`
		: n === MISSIONS.length ? 'Усі відсіки працюють. Станцію відновлено!'
		: `Працює ${n} з ${MISSIONS.length} відсіків. Наступний: «${MISSIONS[nx].name}».`
	);

	onMount(() => {
		if (n !== MISSIONS.length || S.celebrated) return;
		S.celebrated = true; saveNow();
		const t = setTimeout(() => (ui.modal = { kind: 'cert' }), 600);
		return () => clearTimeout(t);
	});
</script>

<section class="hero">
	<div class="hero-head">
		<h1>Станція «Пітон-1», чергує {S.name}</h1>
		<p class="status">{status}</p>
	</div>
	<Station justLit={lit} />
</section>

<section>
	<div class="missions-head">
		<h2>Відсіки станції</h2>
		<p>Відсіки відкриваються по черзі. Зірки: ★★★ — без підказок, ★★ — з підказками, ★ — з розв’язком.</p>
	</div>
	<ol class="mlist">
		{#each MISSIONS as m, i (m.id)}
			{@const done = S.done[m.id]}
			{@const locked = !isUnlocked(i)}
			{@const next = i === nx && !locked}
			<li class:done={!!done} class:next>
				<button class="mrow" type="button" disabled={locked} onclick={() => goto('/m/' + m.id)}>
					<span class="mnum">{i + 1}</span>
					<span><span class="mname">{m.name}</span><span class="mtopic">{m.topic}</span></span>
					<span class="mright">
						{#if done}<span class="st" aria-label="{done.stars} з 3 зірок">{'★'.repeat(done.stars)}<span class="off">{'★'.repeat(3 - done.stars)}</span></span>
						{:else if next}<span class="pill-next">Далі</span>
						{:else if locked}закрито{/if}
					</span>
				</button>
			</li>
		{/each}
	</ol>
</section>
