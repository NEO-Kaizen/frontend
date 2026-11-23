import {
	getUnreadCount as getUnreadCountApi,
	listNotifications as listNotificationsApi,
	markAllNotificationsRead as markAllNotificationsReadApi,
	markNotificationRead as markNotificationReadApi,
	notificationStreamUrl,
	type ListNotificationsOptions
} from '$lib/api/notification.api';
import { ApiError, type Result } from '$lib/types/result';
import type { NotificationItem, NotificationsPage } from '$lib/types/notification';
import { formatDateTime } from '$lib/utils/dates';

const LOAD_ERROR_MESSAGE = 'Não foi possível carregar as notificações.';
const MARK_READ_ERROR_MESSAGE = 'Não foi possível marcar a notificação como lida.';
const MARK_ALL_READ_ERROR_MESSAGE = 'Não foi possível marcar todas como lidas.';

type NotificationError = { status?: number; message: string };

function mapNotificationError(error: unknown, fallback: string): NotificationError {
	if (error instanceof ApiError) {
		return { status: error.status, message: fallback };
	}

	return { message: fallback };
}

async function runNotificationRequest<T>(
	request: () => Promise<T>,
	fallback: string
): Promise<Result<T>> {
	try {
		return { ok: true, data: await request() };
	} catch (error) {
		return { ok: false, error: mapNotificationError(error, fallback) };
	}
}

export function fetchUnreadCount(fetchImpl?: typeof fetch): Promise<Result<number>> {
	return runNotificationRequest(() => getUnreadCountApi(fetchImpl), LOAD_ERROR_MESSAGE);
}

export function fetchNotificationsPage(
	options?: ListNotificationsOptions,
	fetchImpl?: typeof fetch
): Promise<Result<NotificationsPage>> {
	return runNotificationRequest(() => listNotificationsApi(options, fetchImpl), LOAD_ERROR_MESSAGE);
}

export function markAsRead(
	notificationId: string,
	fetchImpl?: typeof fetch
): Promise<Result<{ readAt: string }>> {
	return runNotificationRequest(async () => {
		const response = await markNotificationReadApi(notificationId, fetchImpl);

		return { readAt: response.readAt };
	}, MARK_READ_ERROR_MESSAGE);
}

export function markAllAsRead(fetchImpl?: typeof fetch): Promise<Result<{ markedRead: number }>> {
	return runNotificationRequest(
		() => markAllNotificationsReadApi(fetchImpl),
		MARK_ALL_READ_ERROR_MESSAGE
	);
}

// URL do stream SSE para a âncora atual. O state resolve o endereço pelo
// service para respeitar `states → services → api` (o state nunca importa
// `api/` direto).
export function buildNotificationStreamUrl(lastEventId: string | null): string {
	return notificationStreamUrl(lastEventId);
}

// Texto de "o que mudou" do card, montado só com campos da Allowlist do
// payload (type, protocol, title + condicionais por evento). Vive no service
// (não em `utils/`): é vocabulário de domínio do RF20. Nunca consome scores,
// notas internas ou campos de triagem.
export function describeNotification(item: NotificationItem): string {
	const payload = item.payload;

	switch (payload.type) {
		case 'status_changed':
			return payload.newStatus ? `Novo status: ${payload.newStatus}` : 'Status atualizado';
		case 'pending_item_created':
			return 'Nova pendência aberta';
		case 'pending_item_reopened':
			return 'Pendência reaberta';
		case 'pending_item_validated':
			return 'Pendência validada';
		case 'pending_item_responded':
			return 'Pendência respondida';
		case 'pending_item_responded_unassigned':
			return payload.unassignedWarning ?? 'Pendência respondida — sem responsável designado';
		case 'mapping_scheduled':
		case 'mapping_rescheduled': {
			const when = payload.scheduledAt ? formatDateTime(payload.scheduledAt) : null;
			const action =
				payload.type === 'mapping_scheduled' ? 'Mapeamento agendado' : 'Mapeamento reagendado';
			return when ? `${action}: ${when}` : action;
		}
		case 'responsible_assigned': {
			const details = [payload.category, payload.currentStatus].filter(
				(detail): detail is string => typeof detail === 'string' && detail.length > 0
			);
			return details.length > 0
				? `Responsável designado · ${details.join(' · ')}`
				: 'Responsável designado';
		}
		default:
			return 'Atualização na solicitação';
	}
}
