<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, refreshAll } from '$app/navigation';
	import { LESSONS } from '#lib/lessons/index.js';
	import { S, doneCount, isOpen, starsTotal } from '#lib/state.svelte.js';

	// Учитель може відкрити урок посеред заняття — список оновлюється сам, поки вкладка на екрані.
	onMount(() => {
		const t = setInterval(() => { if (document.visibilityState === 'visible') refreshAll(); }, 15_000);
		return () => clearInterval(t);
	});
</script>

<section class="hero">
	<div class="hero-head">
		<h1>Станція «Пітон-1», чергує {S.name}</h1>
		<p class="status">Обери урок. Нові уроки відкриває вчитель.</p>
	</div>
</section>

<section>
	<div class="missions-head"><h2>Уроки</h2></div>
	<ol class="mlist lessons">
		{#each LESSONS as l, k (l.id)}
			{@const open = isOpen(l)}
			{@const n = doneCount(l)}
			{@const all = l.missions.length}
			<li class:done={open && n === all} class:next={open && n < all}>
				<button class="mrow" type="button" disabled={!open} onclick={() => goto('/l/' + l.id)}>
					<span class="mnum">{k + 1}</span>
					<span>
						<span class="mname">Урок {k + 1}. {l.title}</span>
						<span class="mtopic">{!all ? 'Урок готується' : open ? `Відновлено ${n} з ${all} відсіків` : 'Відкриє вчитель'}</span>
					</span>
					<span class="mright">
						{#if !open}{all ? 'закрито' : 'скоро'}
						{:else if n}<span class="st" aria-label="Зірок: {starsTotal(l)} з {all * 3}">★ {starsTotal(l)}</span>
						{:else}<span class="pill-next">Почати</span>{/if}
					</span>
				</button>
			</li>
		{/each}
	</ol>
</section>
