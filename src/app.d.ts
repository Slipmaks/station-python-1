// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** lessons — id уроків, відкритих учителем для класу учня. */
			student: { id: number; name: string; classId: number; className: string; unlockAll: boolean; lessons: string[] } | null;
			teacher: { id: number; name: string } | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Safari: вимкнути автозаміну в редакторі коду (атрибута немає в типах Svelte)
declare module 'svelte/elements' {
	interface HTMLTextareaAttributes {
		autocorrect?: 'on' | 'off' | null;
	}
}

export {};
