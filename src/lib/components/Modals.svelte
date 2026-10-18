<script lang="ts">
	import { goto } from '$app/navigation';
	import { MISSIONS, lesson } from '#lib/lessons/index.js';
	import { S, doneCount, nextIndex, starsTotal, ui } from '#lib/state.svelte.js';
	import Modal from './Modal.svelte';

	const close = () => (ui.modal = null);
	const date = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
	const rank = (share: number) => lesson.certificate.ranks.find(r => share >= r.from)?.title ?? '';
</script>

{#snippet stars(n: number)}{'★'.repeat(n)}<span class="off">{'★'.repeat(3 - n)}</span>{/snippet}

<Modal>
	{#if ui.modal?.kind === 'complete'}
		{@const { i, stars: st } = ui.modal}
		{@const m = MISSIONS[i]}
		{@const nxt = MISSIONS.findIndex((x, k) => k > i && !S.done[x.id])}
		{@const nextI = nxt >= 0 ? nxt : nextIndex()}
		<h2>Відсік «{m.name}» працює</h2>
		<div class="big-stars" aria-label="{st} з 3 зірок">{@render stars(st)}</div>
		<p style="color:var(--ink-soft)">
			{st === 3 ? 'Бездоганно — без жодної підказки.' : st === 2 ? 'Чудово! Наступного разу спробуй без підказок.' : 'Відсік відновлено. Можеш повернутися сюди пізніше й пройти без підказки.'}
		</p>
		<div class="learned"><b>Що ти вмієш тепер:</b> {m.learned}</div>
		<div class="modal-actions">
			{#if doneCount() === MISSIONS.length}
				<button class="btn amber" type="button" onclick={() => { close(); goto('/'); }}>Подивитися на станцію</button>
			{:else if nextI >= 0}
				<button class="btn amber" type="button" onclick={() => goto('/m/' + MISSIONS[nextI].id)}>Наступний відсік: {MISSIONS[nextI].name}</button>
			{/if}
			<button class="btn plain" type="button" onclick={() => { close(); goto('/'); }}>До станції</button>
		</div>
	{:else if ui.modal?.kind === 'cert'}
		{@const st = starsTotal()}
		{@const max = MISSIONS.length * 3}
		<div class="cert">
			<div style="color:var(--ink-soft)">Станцію «Пітон-1» відновлено</div>
			<div class="who">{S.name}</div>
			<div class="rank">{rank(st / max)}</div>
			<div class="big-stars" style="letter-spacing:0">★ {st} <span style="font-size:20px;color:var(--ink-soft)">з {max}</span></div>
			<div style="color:var(--ink-soft);font-size:14px">{S.className} · {date}</div>
		</div>
		<p style="margin-top:14px">{lesson.certificate.summary} Покажи цей екран учителю.</p>
		<p style="color:var(--ink-soft);font-size:15px">{lesson.certificate.next}</p>
		<div class="modal-actions">
			<button class="btn amber" type="button" onclick={close}>Готово</button>
			<a class="btn plain" href="/sandbox" style="text-decoration:none">До пісочниці</a>
		</div>
	{/if}
</Modal>
