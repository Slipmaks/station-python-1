<script lang="ts">
	import type { Mission } from '#lib/types.js';
	let { m }: { m: Mission } = $props();
</script>

<h1>{m.name}</h1>
<div class="tags"><span class="tag">{m.topic}</span><span class="tag slide">Слайд {m.slide}</span></div>
<p class="story">{@html m.story}</p>
