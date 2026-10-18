<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { MISSIONS } from '#lib/lessons/index.js';
	import { S, doneCount, saveNow, savePending, starsTotal, ui } from '#lib/state.svelte.js';
	import { drain, flush, net, pending } from '#lib/sync.svelte.js';
	import Topbar from '#lib/components/Topbar.svelte';
	import Modals from '#lib/components/Modals.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	afterNavigate(() => (ui.modal = null));

	onMount(() => {
		// вкладку сховали чи закривають — зберігаємо одразу, не чекаючи таймера
		const flushSave = () => { if (savePending()) saveNow(); };
		const onHide = () => { if (document.visibilityState === 'hidden') flushSave(); };
		const onLeave = (e: BeforeUnloadEvent) => { flushSave(); if (net.offline) e.preventDefault(); };
		document.addEventListener('visibilitychange', onHide);
		addEventListener('pagehide', flushSave);
		addEventListener('beforeunload', onLeave);
		addEventListener('online', flush);
		return () => {
			document.removeEventListener('visibilitychange', onHide);
			removeEventListener('pagehide', flushSave);
			removeEventListener('beforeunload', onLeave);
			removeEventListener('online', flush);
		};
	});

	/** Перед виходом дочекатися збереження: після виходу сервер уже не прийме зміни. */
	async function logout(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		if (!savePending() && !pending()) return;
		e.preventDefault();
		const form = e.currentTarget;
		saveNow();
		await drain();
		if (net.offline && !confirm('Немає зв’язку із сервером — останні зміни не збережуться. Однаково вийти?')) return;
		form.submit();
	}
</script>

<Topbar>
	<div class="cells" aria-hidden="true">{#each MISSIONS as m (m.id)}<i class:on={!!S.done[m.id]}></i>{/each}</div>
	<span><span class="pt-long">Відновлено {doneCount()} з {MISSIONS.length}</span><span class="pt-short" aria-hidden="true">{doneCount()}/{MISSIONS.length}</span></span>
	<span class="stars-total" aria-label="Зірок: {starsTotal()}">★ {starsTotal()}</span>
	<a class="tb-btn" href="/sandbox">Пісочниця</a>
	<form method="POST" action="/logout" onsubmit={logout}>
		<button class="tb-btn" type="submit" aria-label="Вийти" title="Вийти ({S.name})"><span class="tb-long">Вийти</span><span class="tb-short" aria-hidden="true">⏻</span></button>
	</form>
</Topbar>
{#if net.offline}<div class="net-warn" role="status">Немає зв’язку із сервером. Прогрес збережеться, щойно зв’язок відновиться, — не закривай вкладку.</div>{/if}
<main>{@render children()}</main>
<!-- Нове вікно (навіть замість відкритого) — новий екземпляр: фокус переходить на його першу кнопку. -->
{#if ui.modal}{#key ui.modal}<Modals />{/key}{/if}
<div aria-live="polite">{#if ui.toast}<div class="toast">{ui.toast}</div>{/if}</div>
