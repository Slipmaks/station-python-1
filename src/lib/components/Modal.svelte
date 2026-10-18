<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ui } from '#lib/state.svelte.js';

	let { children }: { children: Snippet } = $props();
	let md: HTMLDivElement;
	const lastFocus = document.activeElement as HTMLElement | null;
	const close = () => (ui.modal = null);

	$effect(() => {
		const t = setTimeout(() => (md.querySelector<HTMLElement>('.btn, button, input') || md).focus(), 30);
		return () => { clearTimeout(t); if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); };
	});

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
		if (e.key !== 'Tab') return;
		// фокус не виходить за межі вікна
		const f = md.querySelectorAll<HTMLElement>('button, input, a[href], select');
		if (!f.length) return;
		if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
		else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
	}
</script>

<div class="modal" role="dialog" aria-modal="true" tabindex="-1" bind:this={md} onclick={e => e.target === md && close()} onkeydown={keydown}>
	<div class="modal-card">{@render children()}</div>
</div>
