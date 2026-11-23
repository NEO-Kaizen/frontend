// Tipos do RF20 (Notificações in-app) — espelham o contrato HTTP do backend
// (`src/docs/`): a Notificação é uma projeção por destinatário e o banco é a
// fonte de verdade.

export type NotificationType =
	| 'status_changed'
	| 'pending_item_created'
	| 'pending_item_reopened'
	| 'pending_item_validated'
	| 'pending_item_responded'
	| 'pending_item_responded_unassigned'
	| 'mapping_scheduled'
	| 'mapping_rescheduled'
	| 'responsible_assigned'
	| (string & {});

// Payload mínimo (Allowlist): só o essencial para reconhecer a solicitação.
// Campos fora da Allowlist (scores, notas internas, triagem) nunca são
// consumidos aqui, mesmo que o backend um dia os envie.
export interface NotificationPayload {
	type: string;
	protocol: string;
	title: string;
	newStatus?: string;
	scheduledAt?: string;
	category?: string;
	status?: string;
	notice?: string;
}

export interface NotificationItem {
	id: string;
	type: NotificationType;
	payload: NotificationPayload;
	readAt: string | null;
	createdAt: string;
}

export interface NotificationsPage {
	items: NotificationItem[];
	nextCursor: string | null;
}

// Valida o `data:` de um evento SSE antes de usar: garante os campos que a
// UI consome e ignora chaves extras sem quebrar.
export function isNotificationItem(value: unknown): value is NotificationItem {
	if (typeof value !== 'object' || value === null) return false;

	const item = value as Record<string, unknown>;

	if (typeof item.id !== 'string' || typeof item.type !== 'string') return false;
	if (typeof item.createdAt !== 'string') return false;
	if (item.readAt !== null && typeof item.readAt !== 'string') return false;
	if (typeof item.payload !== 'object' || item.payload === null) return false;

	const payload = item.payload as Record<string, unknown>;

	return (
		typeof payload.type === 'string' &&
		typeof payload.protocol === 'string' &&
		typeof payload.title === 'string'
	);
}
