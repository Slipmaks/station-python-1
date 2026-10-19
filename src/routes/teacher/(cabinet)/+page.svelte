<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Мої класи — Станція «Пітон-1»</title></svelte:head>

<h1 class="page-title">Мої класи</h1>
<p class="page-sub">Дайте учням код класу: на сторінці входу вони вводять код, обирають своє ім’я і PIN.</p>

{#if data.classes.length}
	<div class="class-list">
		{#each data.classes as c (c.id)}
			<a class="sheet class-card" href="/teacher/c/{c.id}">
				<h3>{c.name}</h3>
				<div class="class-code" aria-label="Код класу">{c.code}</div>
				<p class="page-sub">Учнів: {c.students} · результати →</p>
			</a>
		{/each}
	</div>
{/if}

<form method="POST" action="?/create" class="sheet form-row">
	<label for="cname">Новий клас</label>
	<input id="cname" name="name" defaultValue={form?.name ?? ''} placeholder="наприклад, 9-Б" required maxlength="30" autocomplete="off" />
	<button class="btn" type="submit">Створити</button>
	{#if form?.error}<p class="form-err" role="alert">{form.error}</p>{/if}
</form>
