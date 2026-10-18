<script lang="ts">
	import { goto } from '$app/navigation';
	import { MISSIONS } from '#lib/lessons/index.js';
	import { S, doneCount, isUnlocked, nextIndex, toast } from '#lib/state.svelte.js';

	let { justLit = null }: { justLit?: string | null } = $props();

	// Відсіки стоять парами (зверху й знизу «хребта»), ширина схеми росте разом із кількістю відсіків.
	const H = 400, spineY = 190;
	const W = 370 + (Math.ceil(MISSIONS.length / 2) - 1) * 166;

	let seed = 7;
	const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
	const stars = Array.from({ length: 70 }, () => ({ x: (rnd() * W).toFixed(0), y: (rnd() * H).toFixed(0), r: (rnd() * 1.4 + 0.4).toFixed(1), o: (rnd() * 0.5 + 0.2).toFixed(2) }));

	const frac = $derived(doneCount() / MISSIONS.length);
	const nx = $derived(nextIndex());
	const mods = $derived(
		MISSIONS.map((m, i) => {
			const col = Math.floor(i / 2), top = i % 2 === 0;
			const x = 118 + col * 166, w = 136, hh = 96;
			const y = top ? spineY - 34 - hh : spineY + 54;
			const done = S.done[m.id], locked = !isUnlocked(i), next = i === nx && !locked;
			return { m, i, x, y, w, hh, top, done, locked, next };
		})
	);
	// Сонячні панелі: 3×4 вогники, світиться частка, що дорівнює частці відновлених відсіків.
	const lights = $derived(Array.from({ length: 12 }, (_, idx) => ({ c: idx % 3, r: Math.floor(idx / 3), lit: idx < Math.round(frac * 12) })));

	function go(i: number) {
		if (isUnlocked(i)) goto('/m/' + MISSIONS[i].id);
		else toast('Цей відсік відкриється, коли відновиш попередній.');
	}
</script>

{#snippet panel(x: number, side: 'l' | 'r')}
	<rect x={side === 'l' ? x + 36 : x - 4} y={spineY - 4} width="12" height="28" fill="#3B5A4B" />
	{#each lights as p, idx (idx)}
		<rect x={x + p.c * 12} y={80 + p.r * 64 + (p.r >= 2 ? 32 : 0)} width="10" height="56" rx="1.5" fill={p.lit ? '#E0A526' : '#28473A'} stroke="#4A6E5D" stroke-width="1" />
	{/each}
{/snippet}

<svg class="station" viewBox="0 0 {W} {H}" role="group" aria-label="Схема станції: відсіки">
	{#each stars as s, k (k)}<circle cx={s.x} cy={s.y} r={s.r} fill="#CFE0D6" opacity={s.o} />{/each}
	{@render panel(16, 'l')}
	{@render panel(W - 52, 'r')}
	<rect x="62" y={spineY} width={W - 124} height="20" rx="6" fill="#3B5A4B" />
	<rect x="62" y={spineY + 8} width={(W - 124) * frac} height="4" rx="2" fill="#E0A526" />
	{#each mods as d (d.m.id)}
		{@const win = d.done ? '#F3D56B' : '#16291F'}
		<g
			class="mod"
			class:done={d.done}
			class:locked={d.locked}
			class:next={d.next}
			class:just-lit={justLit === d.m.id}
			tabindex={d.locked ? -1 : 0}
			role="button"
			aria-label="Відсік {d.i + 1}: {d.m.name}{d.done ? ', відновлено' : d.locked ? ', закрито' : ''}"
			onclick={() => go(d.i)}
			onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(d.i); } }}
		>
			{#if d.top}
				<rect x={d.x + d.w / 2 - 9} y={d.y + d.hh} width="18" height={spineY - d.y - d.hh} fill="#3B5A4B" />
			{:else}
				<rect x={d.x + d.w / 2 - 9} y={spineY + 20} width="18" height={d.y - spineY - 20} fill="#3B5A4B" />
			{/if}
			<rect class="glow" x={d.x - 10} y={d.y - 10} width={d.w + 20} height={d.hh + 20} rx="22" fill="#F3D56B" opacity={d.done ? 0.18 : 0} />
			<rect class="hull" x={d.x} y={d.y} width={d.w} height={d.hh} rx="16" fill={d.done ? '#2F7D5A' : '#20372D'} stroke={d.done ? '#7FCFA2' : '#3E5F50'} stroke-width="2" stroke-dasharray={d.locked ? '6 5' : undefined} />
			<text class="num" x={d.x + 16} y={d.y + 34} fill={d.done ? '#FFFFFF' : d.locked ? '#5E7D6E' : '#E8EFEA'}>{d.i + 1}</text>
			{#each [0, 1, 2] as k (k)}
				<circle cx={d.x + 30 + k * 38} cy={d.y + 64} r="11" fill={win} stroke={d.done ? '#FFF3C4' : '#3E5F50'} stroke-width="2" />
			{/each}
			{#if d.next}<circle class="beacon" cx={d.x + d.w - 18} cy={d.y + 20} r="6" fill="#E0A526" />{/if}
			{#if d.done}<text x={d.x + d.w - 14} y={d.y + 30} text-anchor="end" font-size="16" fill="#F3D56B">{'★'.repeat(d.done.stars)}</text>{/if}
			<text class="lbl" x={d.x + d.w / 2} y={d.top ? d.y - 12 : d.y + d.hh + 26} text-anchor="middle" opacity={d.locked ? 0.5 : 1}>{d.m.name}</text>
		</g>
	{/each}
</svg>
