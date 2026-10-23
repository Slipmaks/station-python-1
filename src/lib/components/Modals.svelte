<script lang="ts">
	import { goto } from '$app/navigation';
	import { findLesson, lessonNo, lessonOf } from '#lib/lessons/index.js';
	import { S, doneCount, nextIndex, starsTotal, ui } from '#lib/state.svelte.js';
	import type { Lesson } from '#lib/types.js';
	import Modal from './Modal.svelte';

	const close = () => (ui.modal = null);
	const date = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
	const rank = (l: Lesson, share: number) => l.certificate?.ranks.find(r => share >= r.from)?.title ?? '';
</script>

{#snippet stars(n: number)}{'★'.repeat(n)}<span class="off">{'★'.repeat(3 - n)}</span>{/snippet}

<Modal>
	{#if ui.modal?.kind === 'complete'}
		{@const { id, stars: st, kept } = ui.modal}
		{@const l = lessonOf(id)!}
		{@const ms = l.missions}
		{@const i = ms.findIndex(x => x.id === id)}
		{@const m = ms[i]}
		{@const nxt = ms.findIndex((x, k) => k > i && !S.done[x.id])}
		{@const nextI = nxt >= 0 ? nxt : nextIndex(l)}
		<h2>Відсік «{m.name}» працює</h2>
		<div class="big-stars" aria-label="{st} з 3 зірок">{@render stars(st)}</div>
		<p style="color:var(--ink-soft)">
			{#if kept}Це повторне проходження — для тренування. У заліку лишається перше: {'★'.repeat(kept)}.
			{:else}{st === 3 ? 'Бездоганно — без жодної підказки.' : st === 2 ? 'Чудово! Наступного разу спробуй без підказок.' : 'Відсік відновлено. Наступного разу спробуй менше підказок і помилок.'}{/if}
		</p>
		<div class="learned"><b>Що ти вмієш тепер:</b> {m.learned}</div>
		<div class="modal-actions">
			{#if doneCount(l) === ms.length}
				<a class="btn amber" href="/l/{l.id}" style="text-decoration:none">Подивитися на станцію</a>
			{:else if nextI >= 0}
				<button class="btn amber" type="button" onclick={() => goto('/m/' + ms[nextI].id)}>Наступний відсік: {ms[nextI].name}</button>
			{/if}
			<!-- посилання, а не close() + goto(): після close() вікно вже не має даних; закриває його сама навігація -->
			<a class="btn plain" href="/l/{l.id}" style="text-decoration:none">До станції</a>
		</div>
	{:else if ui.modal?.kind === 'cert'}
		{@const l = findLesson(ui.modal.lesson)!}
		{@const st = starsTotal(l)}
		{@const max = l.missions.length * 3}
		<div class="cert">
			<div style="color:var(--ink-soft)">Урок {lessonNo(l)} «{l.title}»: станцію відновлено</div>
			<div class="who">{S.name}</div>
			<div class="rank">{rank(l, st / max)}</div>
			<div class="big-stars" style="letter-spacing:0">★ {st} <span style="font-size:20px;color:var(--ink-soft)">з {max}</span></div>
			<div style="color:var(--ink-soft);font-size:14px">{S.className} · {date}</div>
		</div>
		<p style="margin-top:14px">{l.certificate?.summary} Покажи цей екран учителю.</p>
		<p style="color:var(--ink-soft);font-size:15px">{l.certificate?.next}</p>
		<div class="modal-actions">
			<button class="btn amber" type="button" onclick={close}>Готово</button>
			<a class="btn plain" href="/sandbox" style="text-decoration:none">До пісочниці</a>
		</div>
	{/if}
</Modal>
