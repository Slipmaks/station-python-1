<script lang="ts">
	import type { Mission } from '#lib/types.js';
	let { m }: { m: Mission } = $props();
</script>

<h1>{m.name}</h1>
<div class="tags"><span class="tag">{m.topic}</span>{#if m.slide}<span class="tag slide">Слайд {m.slide}</span>{/if}</div>
<p class="story">{@html m.story}</p>
