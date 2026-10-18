<script lang="ts">
	import { highlight } from '#lib/ide.js';

	let {
		value = $bindable(''),
		oninput,
		onrun,
		tall = false
	}: { value?: string; oninput?: (v: string) => void; onrun?: () => void; tall?: boolean } = $props();

	let ta: HTMLTextAreaElement, pre: HTMLPreElement, gut: HTMLDivElement;
	let escaped = false;
	const lines = $derived(value.split('\n').length);

	const sync = () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; };
	$effect(() => { void value; sync(); });

	export function focus() { ta.focus(); }

	/** Вставка через execCommand зберігає історію Ctrl+Z. */
	function insert(text: string) {
		ta.focus();
		if (!document.execCommand || !document.execCommand(text === '' ? 'delete' : 'insertText', false, text)) {
			const s = ta.selectionStart, e = ta.selectionEnd;
			ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
			ta.selectionStart = ta.selectionEnd = s + text.length;
			ta.dispatchEvent(new Event('input'));
		}
	}

	function keydown(e: KeyboardEvent) {
		if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey)) || e.key === 'F5') { e.preventDefault(); onrun?.(); return; }
		// Esc, потім Tab — вийти з редактора клавіатурою
		if (e.key === 'Escape') { escaped = true; return; }
		if (e.key === 'Tab') {
			if (escaped) { escaped = false; return; }
			e.preventDefault();
			const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
			const ls = v.lastIndexOf('\n', s - 1) + 1;
			if ((s !== en && v.slice(s, en).includes('\n')) || e.shiftKey) {
				const le = v.indexOf('\n', en - (en > s && v[en - 1] === '\n' ? 1 : 0)); const lend = le < 0 ? v.length : le;
				const block = v.slice(ls, lend);
				const nb = e.shiftKey ? block.replace(/^ {1,4}/gm, '') : block.replace(/^/gm, '    ');
				ta.setSelectionRange(ls, lend); insert(nb); ta.setSelectionRange(ls, ls + nb.length);
			} else insert('    ');
			return;
		}
		escaped = false;
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			const s = ta.selectionStart, v = ta.value;
			const line = v.slice(v.lastIndexOf('\n', s - 1) + 1, s);
			let ind = (/^ */.exec(line) || [''])[0];
			if (/:\s*(#.*)?$/.test(line)) ind += '    ';
			insert('\n' + ind);
			return;
		}
		if (e.key === 'Backspace' && ta.selectionStart === ta.selectionEnd) {
			const s = ta.selectionStart, v = ta.value;
			const before = v.slice(v.lastIndexOf('\n', s - 1) + 1, s);
			if (before.length >= 4 && /^ +$/.test(before) && before.length % 4 === 0) { e.preventDefault(); ta.setSelectionRange(s - 4, s); insert(''); }
		}
	}
</script>

<div class="editor" class:tall>
	<div class="gutter" aria-hidden="true" bind:this={gut}>{#each { length: lines }, i}<div>{i + 1}</div>{/each}</div>
	<div class="code-area">
		<pre aria-hidden="true" bind:this={pre}><code>{@html highlight(value)}</code></pre>
		<textarea
			bind:this={ta}
			bind:value
			oninput={() => oninput?.(ta.value)}
			onscroll={sync}
			onkeydown={keydown}
			spellcheck="false"
			autocapitalize="off"
			autocomplete="off"
			autocorrect="off"
			aria-label="Редактор коду Python"
		></textarea>
		<span class="ed-hint">Tab — відступ · Ctrl+Enter — запуск</span>
	</div>
</div>
