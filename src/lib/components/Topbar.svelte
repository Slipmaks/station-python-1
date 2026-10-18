<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<header class="topbar">
	<div class="topbar-in">
		<a class="brand" href="/" aria-label="Станція «Пітон-1», на головну">
			<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect x="2" y="13" width="30" height="8" rx="2" fill="#2F7D5A" /><rect x="9" y="5" width="16" height="24" rx="6" fill="#E0A526" /><circle cx="17" cy="13" r="2.4" fill="#173A2C" /><circle cx="17" cy="21" r="2.4" fill="#173A2C" /></svg>
			<span><b>Пітон-1</b><small>інформатика, 9 клас</small></span>
		</a>
		<div class="meter">{@render children?.()}</div>
	</div>
</header>
