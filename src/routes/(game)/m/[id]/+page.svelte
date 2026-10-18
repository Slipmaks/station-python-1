<script lang="ts">
	import { MISSIONS } from '#lib/lessons/index.js';
	import CodeMission from '#lib/components/CodeMission.svelte';
	import ChoiceMission from '#lib/components/ChoiceMission.svelte';
	import TypesMission from '#lib/components/TypesMission.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const m = $derived(MISSIONS[data.i]);
</script>

<div class="crumbs">
	<a class="back" href="/"><span aria-hidden="true">‹</span> До станції</a>
	<span class="where">Відсік {data.i + 1} з {MISSIONS.length}</span>
</div>
{#key m.id}
	{#if m.kind === 'choice'}<ChoiceMission {m} i={data.i} />
	{:else if m.kind === 'types'}<TypesMission {m} i={data.i} />
	{:else}<CodeMission {m} i={data.i} />{/if}
{/key}
