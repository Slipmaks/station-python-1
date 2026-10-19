<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { lessonNo } from '#lib/lessons/index.js';
	import { S, doneCount, flash, isUnlocked, nextIndex, saveNow, ui } from '#lib/state.svelte.js';
	import Station from '#lib/components/Station.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const lesson = $derived(data.lesson);
	const ms = $derived(lesson.missions);

	// Анімацію «ввімкнення» відсіку показуємо один раз.
	const lit = flash.justLit;
	flash.justLit = null;

	const n = $derived(doneCount(lesson));
	const nx = $derived(nextIndex(lesson));
	const status = $derived(
		n === 0 ? `Живлення немає в жодному відсіку. Почни з відсіку «${ms[0].name}».`
		: n === ms.length ? 'Усі відсіки працюють. Станцію відновлено!'
		: `Працює ${n} з ${ms.length} відсіків. Наступний: «${ms[nx].name}».`
	);

	// Сертифікат уроку — один раз, щойно всі відсіки відновлено.
	onMount(() => {
		if (n !== ms.length || S.celebrated.includes(lesson.id)) return;
		S.celebrated.push(lesson.id); saveNow();
		const t = setTimeout(() => (ui.modal = { kind: 'cert', lesson: lesson.id }), 600);
		return () => clearTimeout(t);
	});
</script>

<div class="crumbs"><a class="back" href="/"><span aria-hidden="true">‹</span> Усі уроки</a></div>
<section class="hero">
	<div class="hero-head">
		<h1>Урок {lessonNo(lesson)}. {lesson.title}</h1>
		<p class="status">{status}</p>
	</div>
	<Station {lesson} justLit={lit} />
</section>

<section>
	<div class="missions-head">
		<h2>Відсіки станції</h2>
		<p>Відсіки відкриваються по черзі. Зірки: ★★★ — без підказок, ★★ — з підказками, ★ — з розв’язком.</p>
	</div>
	<ol class="mlist">
		{#each ms as m, i (m.id)}
			{@const done = S.done[m.id]}
			{@const locked = !isUnlocked(lesson, i)}
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
