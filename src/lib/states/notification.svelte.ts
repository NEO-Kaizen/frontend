import { browser } from '$app/environment';
import {
	buildNotificationStreamUrl,
	fetchNotificationsPage,
	fetchUnreadCount
} from '$lib/services/notification.service';
import {
	createNotificationStream,
	type NotificationStreamHandle
} from '$lib/services/notification-stream.service';
import type { NotificationItem } from '$lib/types/notification';
import { notifyInfo } from '$lib/utils/feedback';

export type NotificationStateStatus = 'idle' | 'loading' | 'ready' | 'error';

// Limite do cache de dedup: a janela de replay do SSE é curta (reconexões),
// então 500 ids cobrem com folga sem crescer sem bound.
const MAX_SEEN_IDS = 500;
const INITIAL_PAGE_LIMIT = 20;

class NotificationState {
	unreadCount = $state(0);
	status = $state<NotificationStateStatus>('idle');
	lastEventId = $state<string | null>(null);

	// Fora do $state: dedup, âncora e canal não têm efeito visual direto.
	seenIds = new Set<string>();
	watermarkMs = Number.NEGATIVE_INFINITY;
	stream: NotificationStreamHandle | null = null;
	currentUserId: string | null = null;

	// Ponto único de entrada do sino: troca de usuário reseta, retorno do
	// mesmo usuário (pós-logout) só garante o canal com a âncora guardada.
	async initialize(userId: string | null): Promise<void> {
		if (!browser) return;

		if (userId === null) {
			this.reset();
			return;
		}

		if (userId !== this.currentUserId) {
			this.reset();
			this.currentUserId = userId;
			await this.loadInitial();
			return;
		}

		this.connect();
	}

	// Recarrega o contador a partir do banco (clique no sino / retry de erro).
	async refresh(): Promise<void> {
		if (!browser || this.status === 'loading') return;

		this.disconnect();
		await this.loadInitial();
	}

	reset(): void {
		this.disconnect();
		this.currentUserId = null;
		this.seenIds.clear();
		this.watermarkMs = Number.NEGATIVE_INFINITY;
		this.lastEventId = null;
		this.unreadCount = 0;
		this.status = 'idle';
	}

	disconnect(): void {
		this.stream?.close();
		this.stream = null;
	}

	private async loadInitial(): Promise<void> {
		if (this.status === 'loading') return;

		this.status = 'loading';

		const [countResult, pageResult] = await Promise.all([
			fetchUnreadCount(),
			fetchNotificationsPage({ limit: INITIAL_PAGE_LIMIT })
		]);

		if (!countResult.ok || !pageResult.ok) {
			this.status = 'error';
			return;
		}

		this.unreadCount = countResult.data;
		this.primeCache(pageResult.data.items);
		this.status = 'ready';
		this.connect();
	}

	// Prepara dedup e âncora a partir da primeira página (mais-recente
	// primeiro). A âncora é o item mais novo: o servidor exclui a âncora do
	// replay e reenvia só o posterior, então uma página basta — o cursor
	// completo fica para o Centro de não lidas (#234).
	private primeCache(items: NotificationItem[]): void {
		for (const item of items) {
			this.seenIds.add(item.id);

			const createdAtMs = Date.parse(item.createdAt);

			if (!Number.isNaN(createdAtMs) && createdAtMs > this.watermarkMs) {
				this.watermarkMs = createdAtMs;
			}
		}

		this.trimSeenIds();

		const newest = items[0];

		if (newest) {
			this.lastEventId = newest.id;
		}

		if (this.watermarkMs === Number.NEGATIVE_INFINITY) {
			// Caixa vazia: sem createdAt do servidor, o relógio local
			// distingue backlog (anterior ao snapshot, já contado) de live.
			this.watermarkMs = Date.now();
		}
	}

	// Chegada via SSE. Replay e live podem sobrepor, então o id decide —
	// repetido não soma nem toca o toast. O contador do banco é um snapshot
	// da carga inicial: só incrementa o posterior ao watermark (o anterior,
	// inclusive backlog de conexão sem âncora, já está no snapshot).
	private handleIncoming(item: NotificationItem): void {
		if (this.seenIds.has(item.id)) return;

		this.seenIds.add(item.id);
		this.trimSeenIds();

		const createdAtMs = Date.parse(item.createdAt);
		const isNew = Number.isNaN(createdAtMs) || createdAtMs >= this.watermarkMs;

		if (!Number.isNaN(createdAtMs) && createdAtMs > this.watermarkMs) {
			this.watermarkMs = createdAtMs;
			this.lastEventId = item.id;
		}

		if (item.readAt !== null || !isNew) return;

		this.unreadCount += 1;
		notifyInfo(`Nova notificação: ${item.payload.protocol} — ${item.payload.title}`);
	}

	private connect(): void {
		if (!browser || this.stream !== null) return;

		this.stream = createNotificationStream({
			getUrl: () => buildNotificationStreamUrl(this.lastEventId),
			onItem: (item) => this.handleIncoming(item),
			onOpen: () => {
				if (this.status === 'error') {
					this.status = 'ready';
				}
			},
			onError: () => {
				if (this.status === 'ready') {
					this.status = 'error';
				}
			}
		});
	}

	private trimSeenIds(): void {
		let overflow = this.seenIds.size - MAX_SEEN_IDS;

		if (overflow <= 0) return;

		for (const id of this.seenIds) {
			this.seenIds.delete(id);
			overflow -= 1;

			if (overflow <= 0) return;
		}
	}
}

export const notificationState = new NotificationState();
