<script lang="ts">
	import { onMount } from 'svelte';
	import { refreshAll } from '$app/navigation';
	import { ago } from '#lib/time.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Під час уроку таблиця оновлюється сама, поки вкладка на екрані.
	onMount(() => {
		const t = setInterval(() => { if (document.visibilityState === 'visible') refreshAll(); }, 20_000);
		return () => clearInterval(t);
	});

	const cur = $derived(data.lessons.find(l => l.id === data.lesson)!);

	const cellLabel = (name: string, mission: string, c: { stars: number; attempts: number; fails: number; hints: number }) =>
		`${name}, ${mission}: ${c.stars ? `пройдено на ${c.stars} з 3 зірок` : 'ще не пройдено'}; спроб ${c.attempts}, невдалих ${c.fails}, підказок ${c.hints}`;
</script>

<svelte:head><title>Клас {data.cls.name} — Станція «Пітон-1»</title></svelte:head>

<div class="crumbs"><a class="back" href="/teacher"><span aria-hidden="true">‹</span> Мої класи</a></div>
<div class="class-head">
	<div>
		<h1 class="page-title">Клас {data.cls.name}</h1>
		<p class="page-sub">Учнів: {data.rows.length}. Код для входу учнів:</p>
		<div class="class-code">{data.cls.code}</div>
	</div>
	<form method="POST" action="?lesson={data.lesson}&/unlock" class="sheet unlock">
		<input type="hidden" name="value" value={data.cls.unlockAll ? '0' : '1'} />
		{#if data.cls.unlockAll}
			<p>Усі відсіки відкриті одразу.</p>
			<button class="btn plain" type="submit">Відкривати по черзі</button>
		{:else}
			<p>Відсіки відкриваються по черзі.</p>
			<button class="btn plain" type="submit">Відкрити всі відсіки</button>
		{/if}
	</form>
</div>

<nav class="lesson-tabs" aria-label="Уроки">
	{#each data.lessons as l (l.id)}
		<a href="?lesson={l.id}" class:on={l.id === cur.id} class:open={l.open} aria-current={l.id === cur.id ? 'page' : undefined}>
			Урок {l.no}<small>{!l.ready ? 'готується' : l.open ? 'відкрито' : 'закрито'}</small>
		</a>
	{/each}
</nav>
<div class="lesson-bar">
	<h2>Урок {cur.no}. {cur.title}</h2>
	{#if cur.ready}
		<form method="POST" action="?lesson={cur.id}&/lesson">
			<input type="hidden" name="open" value={cur.open ? '0' : '1'} />
			<span>{cur.open ? 'Урок відкрито учням.' : 'Учні поки не бачать цього уроку.'}</span>
			<button class="btn {cur.open ? 'plain' : 'amber'}" type="submit">{cur.open ? 'Закрити урок' : 'Відкрити урок класу'}</button>
		</form>
	{/if}
</div>

{#if !cur.ready}
	<p class="sheet">Урок ще готується — відсіків у ньому поки немає.</p>
{:else if !data.rows.length}
	<p class="sheet">Ще ніхто не увійшов. Учні відкривають сторінку входу, вводять код <b class="mono">{data.cls.code}</b> і реєструються.</p>
{:else}
	<div class="report-wrap">
		<table class="report">
			<caption class="sr-only">Результати учнів класу {data.cls.name} за відсіками уроку {cur.no}</caption>
			<thead>
				<tr>
					<th scope="col" class="who">Учень</th>
					{#each data.missions as m, k (m.id)}<th scope="col" title={m.name}><abbr title={m.name}>{k + 1}</abbr></th>{/each}
					<th scope="col">Відсіків</th>
					<th scope="col">★</th>
					<th scope="col">Активність</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<th scope="row" class="who">
							<a href="/teacher/c/{data.cls.id}/s/{r.id}">{r.name}</a>
							{#if r.locked}<span class="badge" title="5 неправильних PIN поспіль">вхід заблоковано</span>{/if}
						</th>
						{#each r.cells as c, k (k)}
							<td class:done={c && c.stars > 0} class:stuck={c?.stuck} class:tried={c && !c.stars && !c.stuck}>
								{#if c}
									<a href="/teacher/c/{data.cls.id}/s/{r.id}#m-{data.missions[k].id}" aria-label={cellLabel(r.name, data.missions[k].name, c)} title={cellLabel(r.name, data.missions[k].name, c)}>
										{#if c.stars}{'★'.repeat(c.stars)}{:else}{c.attempts}{/if}
									</a>
								{/if}
							</td>
						{/each}
						<td>{r.done}/{data.missions.length}</td>
						<td>{r.stars}</td>
						<td class="when">{ago(r.last, data.now)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<th scope="row" class="who">Пройшли</th>
					{#each data.totals as t, k (k)}<td>{t}</td>{/each}
					<td colspan="3"></td>
				</tr>
			</tfoot>
		</table>
	</div>
	<p class="legend">
		<span class="sw done"></span> пройдено (зірки) · <span class="sw tried"></span> число — спроби, ще не пройдено ·
		<span class="sw stuck"></span> {data.stuckFails}+ невдалих спроб — варто підійти. Натисніть на клітинку, щоб побачити код учня. Таблиця оновлюється кожні 20 секунд.
	</p>
{/if}
