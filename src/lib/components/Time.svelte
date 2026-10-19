<script lang="ts">
	import { onMount } from 'svelte';

	let { d }: { d: Date } = $props();
	// Форматуємо лише в браузері — у часовому поясі вчителя; сервер (Vercel) працює в UTC.
	let mounted = $state(false);
	onMount(() => (mounted = true));
</script>

<time datetime={d.toISOString()}>{#if mounted}{d.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{/if}</time>
