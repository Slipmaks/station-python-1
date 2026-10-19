<script lang="ts">
	import Topbar from '#lib/components/Topbar.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<Topbar>
	<span>{data.teacher.name}</span>
	<form method="POST" action="/logout"><button class="tb-btn" type="submit">Вийти</button></form>
</Topbar>
<main>{@render children()}</main>
