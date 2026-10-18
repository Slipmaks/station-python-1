<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Py, type RunResult } from '#lib/py.js';
	import { explainError } from '#lib/ide.js';

	let {
		res,
		note = '',
		quietEmpty = false,
		children
	}: { res: RunResult; note?: string; quietEmpty?: boolean; children?: Snippet } = $props();

	const prev = $derived(Py.outputText(res));
	const errText = $derived(res.error ? (prev && !prev.endsWith('\n') ? '\n' : '') + Py.formatError(res.error) : '');
	const explain = $derived(explainError(res.error, res.events));
	const empty = $derived(!res.out.length && !res.error && !res.needInput && !quietEmpty);
	// Консоль має white-space: pre-wrap, тому розмітку нижче записано в один рядок без пробілів між вузлами.
</script>

{#if note}<div class="sys">{note}</div>{/if}{#each res.out as seg, k (k)}<span class:in={seg.kind === 'in'}>{seg.text}</span>{/each}{#if errText}<span class="err">{errText}</span>{/if}{#if explain}<div class="explain">{@html explain}</div>{/if}{#if res.events.some(e => e.type === 'antigravity')}<div class="sys">Злітаємо! Справжній Python відкрив би комікс xkcd про те, як Python допоміг полетіти: <a href="https://xkcd.com/353/" target="_blank" rel="noopener" style="color:var(--c-kw)">xkcd.com/353</a></div>{/if}{#if empty}<span class="sys">Програма виконалась, але нічого не вивела.</span>{/if}{@render children?.()}
