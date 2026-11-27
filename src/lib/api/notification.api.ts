import { env } from '$env/dynamic/public';
import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { NotificationsPage } from '$lib/types/notification';

const NOTIFICATIONS_PATH = '/notifications';

interface UnreadCountResponse {
	unreadCount: number;
}

// GET /notifications/unread-count — contador de não lidas do usuário autenticado.
export async function getUnreadCount(fetchImpl?: typeof fetch): Promise<number> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.notifications) {
		const mod = (await import('$lib/mocks/notification.mock')) as Record<string, unknown>;
		if (typeof mod.getUnreadCountMock === 'function') {
			return (mod.getUnreadCountMock as typeof getUnreadCount)();
		}
	}

	const response = await apiClient<UnreadCountResponse>(
		`${NOTIFICATIONS_PATH}/unread-count`,
		{},
		fetchImpl
	);

	return response.unreadCount;
}

export interface ListNotificationsOptions {
	cursor?: string;
	limit?: number;
}

// GET /notifications — página da mais recente para a mais antiga.
export async function listNotifications(
	options?: ListNotificationsOptions,
	fetchImpl?: typeof fetch
): Promise<NotificationsPage> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.notifications) {
		const mod = (await import('$lib/mocks/notification.mock')) as Record<string, unknown>;
		if (typeof mod.listNotificationsMock === 'function') {
			return (mod.listNotificationsMock as typeof listNotifications)(options, fetchImpl);
		}
	}

	const params = new URLSearchParams();

	if (options?.cursor) params.set('cursor', options.cursor);
	if (options?.limit !== undefined) params.set('limit', String(options.limit));

	const query = params.size > 0 ? `?${params.toString()}` : '';

	return apiClient<NotificationsPage>(`${NOTIFICATIONS_PATH}${query}`, {}, fetchImpl);
}

export interface MarkNotificationReadResponse {
	id: string;
	readAt: string;
}

export interface MarkAllNotificationsReadResponse {
	markedRead: number;
}

// PATCH /notifications/:notificationId/read — idempotente (repete o instante original).
export async function markNotificationRead(
	notificationId: string,
	fetchImpl?: typeof fetch
): Promise<MarkNotificationReadResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.notifications) {
		const mod = (await import('$lib/mocks/notification.mock')) as Record<string, unknown>;
		if (typeof mod.markNotificationReadMock === 'function') {
			return (mod.markNotificationReadMock as typeof markNotificationRead)(notificationId);
		}
	}

	const encoded = encodeURIComponent(notificationId);

	return apiClient<MarkNotificationReadResponse>(
		`${NOTIFICATIONS_PATH}/${encoded}/read`,
		{ method: 'PATCH' },
		fetchImpl
	);
}

// PATCH /notifications/read-all — marca em massa as não lidas do usuário autenticado.
export async function markAllNotificationsRead(
	fetchImpl?: typeof fetch
): Promise<MarkAllNotificationsReadResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.notifications) {
		const mod = (await import('$lib/mocks/notification.mock')) as Record<string, unknown>;
		if (typeof mod.markAllNotificationsReadMock === 'function') {
			return (mod.markAllNotificationsReadMock as typeof markAllNotificationsRead)();
		}
	}

	return apiClient<MarkAllNotificationsReadResponse>(
		`${NOTIFICATIONS_PATH}/read-all`,
		{ method: 'PATCH' },
		fetchImpl
	);
}

// URL do stream SSE. O EventSource do navegador não envia headers
// personalizados, por isso a âncora de reconexão vai na query
// (`Last-Event-ID` como header só vale para clientes não-browser).
export function notificationStreamUrl(lastEventId?: string | null): string {
	const baseUrl = env.PUBLIC_API_URL?.replace(/\/$/, '');

	if (!baseUrl) {
		throw new Error('PUBLIC_API_URL não está definida no ambiente.');
	}

	const query = lastEventId ? `?lastEventId=${encodeURIComponent(lastEventId)}` : '';

	return `${baseUrl}${NOTIFICATIONS_PATH}/stream${query}`;
}
