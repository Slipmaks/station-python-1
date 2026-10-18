<script lang="ts">
	import Topbar from '#lib/components/Topbar.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Кабінет учителя — Станція «Пітон-1»</title></svelte:head>

<Topbar />
<main class="narrow">
	<h1 class="page-title">Кабінет учителя</h1>
	<p class="page-sub">Учні входять за кодом класу на <a href="/login">сторінці входу</a>.</p>
	<form method="POST" class="sheet form-stack">
		<label for="login">Логін</label>
		<input id="login" name="login" value={form?.login ?? ''} required autocomplete="username" />
		<label for="password">Пароль</label>
		<input id="password" name="password" type="password" required autocomplete="current-password" />
		{#if form?.error}<p class="form-err" role="alert">{form.error}</p>{/if}
		<button class="btn" type="submit">Увійти</button>
	</form>
</main>
