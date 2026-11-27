import type {
	ListNotificationsOptions,
	MarkAllNotificationsReadResponse,
	MarkNotificationReadResponse
} from '$lib/api/notification.api';
import type { NotificationItem, NotificationsPage } from '$lib/types/notification';
import { ApiError } from '$lib/types/result';

// Fixtures — dados fictícios do domínio de notificações, consumidos apenas
// pelos mocks. Protocolos e títulos acompanham `requests.mock.ts`.
const mockNotifications: NotificationItem[] = [
	{
		id: 'b0000000-0000-4000-8000-000000000002',
		type: 'pending_item_created',
		payload: {
			type: 'pending_item_created',
			protocol: 'MAAT-6N2W-8VBM',
			title: 'Revisar prestação de contas'
		},
		readAt: null,
		createdAt: '2026-11-20T15:40:00.000Z'
	},
	{
		id: 'b0000000-0000-4000-8000-000000000001',
		type: 'status_changed',
		payload: {
			type: 'status_changed',
			protocol: 'MAAT-8K3P-9X2M',
			title: 'Automatizar conferência de diárias',
			newStatus: 'Aguardando mapeamento'
		},
		readAt: null,
		createdAt: '2026-11-20T15:35:00.000Z'
	},
	{
		id: 'b0000000-0000-4000-8000-000000000003',
		type: 'pending_item_validated',
		payload: {
			type: 'pending_item_validated',
			protocol: 'MAAT-6N2W-8VBM',
			title: 'Revisar prestação de contas'
		},
		readAt: '2026-11-20T16:00:00.000Z',
		createdAt: '2026-11-20T15:20:00.000Z'
	}
];

const DEFAULT_PAGE_LIMIT = 20;

export function getUnreadCountMock(): Promise<number> {
	const unreadCount = mockNotifications.filter((item) => item.readAt === null).length;

	return Promise.resolve(unreadCount);
}

export function listNotificationsMock(
	options?: ListNotificationsOptions
): Promise<NotificationsPage> {
	const limit = options?.limit ?? DEFAULT_PAGE_LIMIT;

	let items = mockNotifications;

	if (options?.cursor) {
		const anchorIndex = mockNotifications.findIndex((item) => item.id === options.cursor);
		items = anchorIndex < 0 ? [] : mockNotifications.slice(anchorIndex + 1);
	}

	const page = items.slice(0, limit);
	const hasMore = items.length > page.length;

	return Promise.resolve({ items: page, nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null });
}

export function markNotificationReadMock(
	notificationId: string
): Promise<MarkNotificationReadResponse> {
	const item = mockNotifications.find((candidate) => candidate.id === notificationId);

	if (!item) {
		throw new ApiError(404, 'Notificação não encontrada.');
	}

	item.readAt ??= new Date().toISOString();

	return Promise.resolve({ id: item.id, readAt: item.readAt });
}

export function markAllNotificationsReadMock(): Promise<MarkAllNotificationsReadResponse> {
	const now = new Date().toISOString();
	let markedRead = 0;

	for (const item of mockNotifications) {
		if (item.readAt === null) {
			item.readAt = now;
			markedRead += 1;
		}
	}

	return Promise.resolve({ markedRead });
}
