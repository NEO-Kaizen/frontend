import {
	getUnreadCount as getUnreadCountApi,
	listNotifications as listNotificationsApi,
	notificationStreamUrl,
	type ListNotificationsOptions
} from '$lib/api/notification.api';
import { ApiError, type Result } from '$lib/types/result';
import type { NotificationsPage } from '$lib/types/notification';

const LOAD_ERROR_MESSAGE = 'Não foi possível carregar as notificações.';

type NotificationError = { status?: number; message: string };

function mapNotificationError(error: unknown): NotificationError {
	if (error instanceof ApiError) {
		return { status: error.status, message: LOAD_ERROR_MESSAGE };
	}

	return { message: LOAD_ERROR_MESSAGE };
}

export async function fetchUnreadCount(fetchImpl?: typeof fetch): Promise<Result<number>> {
	try {
		const unreadCount = await getUnreadCountApi(fetchImpl);

		return { ok: true, data: unreadCount };
	} catch (error) {
		return { ok: false, error: mapNotificationError(error) };
	}
}

export async function fetchNotificationsPage(
	options?: ListNotificationsOptions,
	fetchImpl?: typeof fetch
): Promise<Result<NotificationsPage>> {
	try {
		const page = await listNotificationsApi(options, fetchImpl);

		return { ok: true, data: page };
	} catch (error) {
		return { ok: false, error: mapNotificationError(error) };
	}
}

// URL do stream SSE para a âncora atual. O state resolve o endereço pelo
// service para respeitar `states → services → api` (o state nunca importa
// `api/` direto).
export function buildNotificationStreamUrl(lastEventId: string | null): string {
	return notificationStreamUrl(lastEventId);
}
