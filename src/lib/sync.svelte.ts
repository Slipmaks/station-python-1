/* Черга запитів до сервера: надсилає по одному, без зв’язку повторює, нічого не губить. */

type Job = { url: string; method: 'POST' | 'PUT'; body: unknown; /** однаковий key — лишаємо тільки останній стан */ key?: string };

const queue: Job[] = [];
let busy = false;
let retry: ReturnType<typeof setTimeout> | undefined;
export const net = $state({ offline: false });

export function send(job: Job) {
	if (job.key) {
		// не чіпаємо запит, що вже летить (queue[0], поки busy)
		const k = queue.findIndex((j, idx) => j.key === job.key && !(busy && idx === 0));
		if (k >= 0) queue.splice(k, 1);
	}
	queue.push(job);
	void flush();
}
export const pending = () => queue.length > 0;
/** Дочекатися, поки черга спорожніє або зник зв’язок. */
export async function drain() {
	void flush();
	while (queue.length && !net.offline) await new Promise(r => setTimeout(r, 100));
}

export async function flush() {
	if (busy) return;
	busy = true;
	clearTimeout(retry);
	try {
		while (queue.length) {
			const j = queue[0];
			const body = JSON.stringify(j.body);
			let r: Response;
			try {
				// keepalive — щоб останнє збереження долетіло, навіть якщо вкладку закривають (до 64 КБ)
				r = await fetch(j.url, { method: j.method, headers: { 'content-type': 'application/json' }, body, keepalive: body.length < 60_000 });
			} catch {
				r = new Response(null, { status: 503 });
			}
			if (r.status === 401) { location.href = '/login'; return; } // сесія скінчилася
			if (r.status >= 500) {
				net.offline = true;
				retry = setTimeout(flush, 5000);
				return;
			}
			if (!r.ok) console.error('Сервер відхилив запит', j.url, r.status, await r.text()); // 4xx — повтор не допоможе
			queue.shift();
			net.offline = false;
		}
	} finally {
		busy = false;
	}
}
