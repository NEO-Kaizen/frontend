import { browser } from '$app/environment';
import {
	buildNotificationStreamUrl,
	fetchNotificationsPage,
	fetchUnreadCount,
	markAllAsRead,
	markAsRead
} from '$lib/services/notification.service';
import {
	createNotificationStream,
	type NotificationStreamHandle
} from '$lib/services/notification-stream.service';
import type { Result } from '$lib/types/result';
import type { NotificationItem } from '$lib/types/notification';

export type NotificationStateStatus = 'idle' | 'loading' | 'ready' | 'error';
export type NotificationCenterStatus = 'idle' | 'loading' | 'ready' | 'error';

// Limite do cache de dedup: a janela de replay do SSE é curta (reconexões),
// então 500 ids cobrem com folga sem crescer sem bound.
const MAX_SEEN_IDS = 500;
// Teto da lista do Centro em memória: a paginação por cursor continua no
// servidor; aqui é só proteção contra crescimento sem bound via SSE.
const MAX_CENTER_ITEMS = 100;
const INITIAL_PAGE_LIMIT = 20;

class NotificationState {
	unreadCount = $state(0);
	status = $state<NotificationStateStatus>('idle');
	lastEventId = $state<string | null>(null);

	items = $state<NotificationItem[]>([]);
	nextCursor = $state<string | null>(null);
	centerStatus = $state<NotificationCenterStatus>('idle');
	isLoadingMore = $state(false);
	// Última chegada via SSE: o sino observa e toca o toast (o state nunca
	// importa feedback — `states → services e types`).
	lastArrived = $state<NotificationItem | null>(null);

	// Fora do $state: dedup, âncora e canal não têm efeito visual direto.
	seenIds = new Set<string>();
	watermarkMs = Number.NEGATIVE_INFINITY;
	stream: NotificationStreamHandle | null = null;
	currentUserId: string | null = null;
	centerLoaded = false;

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

	// Recarrega o contador a partir do banco (retry do sino em erro).
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
		this.items = [];
		this.nextCursor = null;
		this.centerStatus = 'idle';
		this.isLoadingMore = false;
		this.centerLoaded = false;
		this.lastArrived = null;
	}

	disconnect(): void {
		this.stream?.close();
		this.stream = null;
	}

	// Primeira página do Centro (abrir o container é só leitura: nunca
	// altera estados de leitura). Reaproveita o cache quando a carga inicial
	// do sino já trouxe a página.
	async loadCenter(): Promise<void> {
		if (!browser || this.centerStatus === 'loading') return;

		if (this.centerLoaded) {
			this.centerStatus = 'ready';
			return;
		}

		this.centerStatus = 'loading';

		const pageResult = await fetchNotificationsPage({ limit: INITIAL_PAGE_LIMIT });

		if (!pageResult.ok) {
			this.centerStatus = 'error';
			return;
		}

		this.trackItems(pageResult.data.items);
		this.items = pageResult.data.items;
		this.nextCursor = pageResult.data.nextCursor;
		this.centerLoaded = true;
		this.centerStatus = 'ready';
	}

	// Persegue o cursor opaco do servidor (mais antigos). O cursor é posicional
	// no servidor, então chegadas via SSE não deslocam as páginas; a dedup por
	// id protege de qualquer sobreposição residual.
	async loadMore(): Promise<Result<void>> {
		if (!browser || this.isLoadingMore || this.nextCursor === null)
			return { ok: true, data: undefined };

		this.isLoadingMore = true;

		const pageResult = await fetchNotificationsPage({
			cursor: this.nextCursor,
			limit: INITIAL_PAGE_LIMIT
		});

		this.isLoadingMore = false;

		if (!pageResult.ok) {
			return { ok: false, error: { message: 'Não foi possível carregar mais notificações.' } };
		}

		this.trackItems(pageResult.data.items);

		const knownIds = new Set(this.items.map((item) => item.id));
		const fresh = pageResult.data.items.filter((item) => !knownIds.has(item.id));

		this.items = [...this.items, ...fresh].slice(0, MAX_CENTER_ITEMS);
		this.nextCursor = pageResult.data.nextCursor;

		return { ok: true, data: undefined };
	}

	// Marca uma Notificação como lida: API primeiro, espelho local depois —
	// sem rollback porque o local só anda quando o banco confirma.
	async markRead(notificationId: string): Promise<Result<void>> {
		if (!browser) {
			return { ok: false, error: { message: 'Não foi possível marcar a notificação como lida.' } };
		}

		const result = await markAsRead(notificationId);

		if (!result.ok) return result;

		const item = this.items.find((candidate) => candidate.id === notificationId);

		if (item && item.readAt === null) {
			item.readAt = result.data.readAt;
			this.unreadCount = Math.max(0, this.unreadCount - 1);
		}

		return { ok: true, data: undefined };
	}

	// Marca todas como lidas com a mesma semântica: banco primeiro, espelho
	// local depois. Chama a API sempre que houver não lidas — mesmo que a
	// página carregada esteja toda lida (não-lidas antigas vivem no cursor).
	async markAllRead(): Promise<Result<void>> {
		if (!browser) {
			return { ok: false, error: { message: 'Não foi possível marcar todas como lidas.' } };
		}

		if (this.unreadCount === 0) return { ok: true, data: undefined };

		const result = await markAllAsRead();

		if (!result.ok) return result;

		const readAt = new Date().toISOString();

		for (const item of this.items) {
			if (item.readAt === null) {
				item.readAt = readAt;
			}
		}

		this.unreadCount = 0;

		return { ok: true, data: undefined };
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
		this.trackItems(pageResult.data.items);

		// A lista vem da mais recente para a mais antiga: o primeiro item é
		// a âncora de reconexão (o servidor exclui a âncora do replay).
		const newest = pageResult.data.items[0];

		if (newest) {
			this.lastEventId = newest.id;
		}

		if (this.watermarkMs === Number.NEGATIVE_INFINITY) {
			// Caixa vazia: sem createdAt do servidor, o relógio local
			// distingue backlog (anterior ao snapshot, já contado) de live.
			this.watermarkMs = Date.now();
		}

		this.status = 'ready';
		this.connect();
	}

	// Registra itens no dedup e no watermark (snapshot do banco). Não mexe na
	// âncora: ela só anda para frente, via SSE.
	private trackItems(items: NotificationItem[]): void {
		for (const item of items) {
			this.seenIds.add(item.id);

			const createdAtMs = Date.parse(item.createdAt);

			if (!Number.isNaN(createdAtMs) && createdAtMs > this.watermarkMs) {
				this.watermarkMs = createdAtMs;
			}
		}

		this.trimSeenIds();
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

		if (this.centerLoaded) {
			this.items = [item, ...this.items].slice(0, MAX_CENTER_ITEMS);
		}

		if (item.readAt !== null || !isNew) return;

		this.unreadCount += 1;
		this.lastArrived = item;
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
