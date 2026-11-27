import { isNotificationItem, type NotificationItem } from '$lib/types/notification';

interface NotificationStreamOptions {
	// Lida a cada (re)conexão, para a âncora acompanhar as chegadas.
	getUrl: () => string;
	onItem: (item: NotificationItem) => void;
	onError: () => void;
	onOpen: () => void;
}

export interface NotificationStreamHandle {
	close: () => void;
}

// Base do backoff: o servidor anuncia `retry: 3000` no handshake do SSE.
const BASE_RETRY_MS = 3000;
const MAX_RETRY_MS = 30000;

// Cliente SSE do RF20: envolve o EventSource do navegador, valida cada
// `data:` contra a Allowlist e reconecta com backoff. Comentários
// keep-alive (`: keep-alive`) nunca chegam ao `onmessage`, então são
// ignorados por construção.
export function createNotificationStream({
	getUrl,
	onItem,
	onError,
	onOpen
}: NotificationStreamOptions): NotificationStreamHandle {
	let eventSource: EventSource | null = null;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;
	let closed = false;
	let retryDelay = BASE_RETRY_MS;

	function clearTimer(): void {
		if (retryTimer !== null) {
			clearTimeout(retryTimer);
			retryTimer = null;
		}
	}

	function scheduleReconnect(): void {
		if (closed) return;

		clearTimer();
		const delay = retryDelay;
		retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
		retryTimer = setTimeout(connect, delay);
	}

	function connect(): void {
		if (closed) return;

		eventSource = new EventSource(getUrl(), { withCredentials: true });

		eventSource.addEventListener('notification', (event) => {
			const message = event as MessageEvent;

			try {
				const parsed: unknown = JSON.parse(message.data);

				if (!isNotificationItem(parsed)) return;

				onItem(parsed);
			} catch {
				// Chunk fora do formato: ignora sem derrubar o canal.
			}
		});

		eventSource.onopen = () => {
			retryDelay = BASE_RETRY_MS;
			onOpen();
		};

		eventSource.onerror = () => {
			eventSource?.close();
			eventSource = null;
			onError();
			scheduleReconnect();
		};
	}

	connect();

	return {
		close() {
			closed = true;
			clearTimer();
			eventSource?.close();
			eventSource = null;
		}
	};
}
