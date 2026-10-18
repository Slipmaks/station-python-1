<script lang="ts">
	import Topbar from '#lib/components/Topbar.svelte';
	import { MISSIONS } from '#lib/lessons/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Мої класи — Станція «Пітон-1»</title></svelte:head>

<Topbar>
	<span>{data.teacher.name}</span>
	<form method="POST" action="/logout"><button class="tb-btn" type="submit">Вийти</button></form>
</Topbar>
<main>
	<h1 class="page-title">Мої класи</h1>
	<p class="page-sub">Дайте учням код класу: на сторінці входу вони вводять код, обирають своє ім’я і PIN. Таблиця результатів з’явиться тут згодом.</p>

	{#if data.classes.length}
		<div class="class-list">
			{#each data.classes as c (c.id)}
				<section class="sheet">
					<h3>{c.name}</h3>
					<div class="class-code" aria-label="Код класу">{c.code}</div>
					<p class="page-sub">Учнів: {c.students}</p>
					<form method="POST" action="?/unlock">
						<input type="hidden" name="id" value={c.id} />
						<input type="hidden" name="value" value={c.unlockAll ? '0' : '1'} />
						{#if c.unlockAll}
							<p>Усі відсіки відкриті одразу.</p>
							<button class="btn plain" type="submit">Відкривати по черзі</button>
						{:else}
							<p>Відсіки відкриваються по черзі.</p>
							<button class="btn plain" type="submit">Відкрити всі відсіки</button>
						{/if}
					</form>
				</section>
			{/each}
		</div>
	{/if}

	<form method="POST" action="?/create" class="sheet form-row">
		<label for="cname">Новий клас</label>
		<input id="cname" name="name" value={form?.name ?? ''} placeholder="наприклад, 9-Б" required maxlength="30" autocomplete="off" />
		<button class="btn" type="submit">Створити</button>
		{#if form?.error}<p class="form-err" role="alert">{form.error}</p>{/if}
	</form>

	<h2 class="section-title">Відсіки й слайди презентації</h2>
	<table class="slides">
		<tbody>
			{#each MISSIONS as m, i (m.id)}<tr><td>{i + 1}</td><td>{m.name}</td><td>{m.topic}</td><td>сл. {m.slide}</td></tr>{/each}
		</tbody>
	</table>
</main>
