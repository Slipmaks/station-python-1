<script lang="ts">
	import Time from '#lib/components/Time.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const done = $derived(data.missions.filter(m => m.done));
	const stars = $derived(done.reduce((a, m) => a + (m.done?.stars ?? 0), 0));
	const untouched = $derived(data.missions.filter(m => !m.total && !m.done));
</script>

<svelte:head><title>{data.student.name} — Станція «Пітон-1»</title></svelte:head>

<div class="crumbs"><a class="back" href="/teacher/c/{data.cls.id}"><span aria-hidden="true">‹</span> Клас {data.cls.name}</a></div>
<h1 class="page-title">{data.student.name}</h1>
<p class="page-sub">
	Відсіків: {done.length} з {data.missions.length} · ★ {stars} · у грі з <Time d={data.student.createdAt} />
	{#if data.student.lockedUntil}· <b class="form-err">вхід заблоковано до <Time d={data.student.lockedUntil} /></b>{/if}
</p>

{#if form?.pin}
	<div class="verdict good pin-box" role="status">Новий PIN для {data.student.name}: <b class="mono">{form.pin}</b>. Передайте його учню — більше ніде він не показується. Блокування знято.</div>
{/if}
<div class="student-actions">
	<form method="POST" action="?/resetPin"><button class="btn plain" type="submit">Видати новий PIN</button></form>
	<details class="danger-zone">
		<summary class="btn plain">Видалити учня…</summary>
		<form method="POST" action="?/delete" class="sheet">
			<p>Буде видалено учня та всі його результати й спроби. Скасувати це неможливо.</p>
			<button class="btn danger" type="submit">Так, видалити «{data.student.name}»</button>
		</form>
	</details>
</div>

{#each data.missions as m, k (m.id)}
	{#if m.total || m.done}
		<section class="sheet attempt-group" id="m-{m.id}">
			<h3>
				{k + 1}. {m.name}
				{#if m.done}<span class="st" aria-label="{m.done.stars} з 3 зірок">{'★'.repeat(m.done.stars)}<span class="off">{'★'.repeat(3 - m.done.stars)}</span></span>{/if}
			</h3>
			{#if m.total}
				<p class="page-sub">
					{m.kind === 'code' ? 'Запусків' : 'Відповідей'}: {m.total} · невдалих: {m.fails}{#if m.kind === 'code'}{' · '}підказок: {m.hints}{/if}
					{#if m.done} · пройдено <Time d={m.done.completedAt} />{/if}
					{#if m.total > data.shown} · показано {data.shown} останніх{/if}
				</p>
				<ol class="attempts">
					{#each m.attempts as a (a.id)}
						<li class:ok={a.passed}>
							<div class="attempt-meta">
								<span class="mark" aria-label={a.passed ? 'вдало' : 'невдало'}>{a.passed ? '✓' : '✗'}</span>
								<Time d={a.createdAt} />
								{#if m.stepName}<span>{m.stepName} {a.step + 1}</span>{/if}
								{#if a.hints}<span>підказок: {a.hints}</span>{/if}
							</div>
							{#if m.kind === 'code'}<pre class="qcode">{a.answer}</pre>{:else}<div class="mono">{a.answer}</div>{/if}
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	{/if}
{/each}
{#if untouched.length}
	<p class="page-sub">Не розпочато: {untouched.map(m => `${data.missions.indexOf(m) + 1}. ${m.name}`).join(', ')}.</p>
{/if}
