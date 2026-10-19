<script lang="ts">
	import CodeMission from '#lib/components/CodeMission.svelte';
	import ChoiceMission from '#lib/components/ChoiceMission.svelte';
	import TypesMission from '#lib/components/TypesMission.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const m = $derived(data.lesson.missions[data.i]);
</script>

<div class="crumbs">
	<a class="back" href="/l/{data.lesson.id}"><span aria-hidden="true">‹</span> До станції</a>
	<span class="where">Відсік {data.i + 1} з {data.lesson.missions.length}</span>
</div>
{#key m.id}
	{#if m.kind === 'choice'}<ChoiceMission {m} />
	{:else if m.kind === 'types'}<TypesMission {m} />
	{:else}<CodeMission {m} />{/if}
{/key}
