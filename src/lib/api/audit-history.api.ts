import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';

import type {
	AuditHistoryDetail,
	AuditHistoryListResponse,
	AuditHistoryQuery
} from '$lib/types/audit';

const AUDIT_HISTORY_PATH = '/audit-history';

export async function listAuditHistory(
	query: AuditHistoryQuery,
	fetchImpl?: typeof fetch
): Promise<AuditHistoryListResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.auditHistory) {
		const { listAuditHistoryMock } = await import('$lib/mocks/audit-history.mock');
		return listAuditHistoryMock(query);
	}

	const params = new URLSearchParams();

	if (query.page !== undefined) {
		params.set('page', String(query.page));
	}

	if (query.limit !== undefined) {
		params.set('limit', String(query.limit));
	}

	if (query.entityType) {
		params.set('entityType', query.entityType);
	}

	const queryString = params.toString();

	return apiClient<AuditHistoryListResponse>(
		queryString ? `${AUDIT_HISTORY_PATH}?${queryString}` : AUDIT_HISTORY_PATH,
		{},
		fetchImpl
	);
}

export async function getAuditHistoryDetail(
	id: number,
	fetchImpl?: typeof fetch
): Promise<AuditHistoryDetail> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.auditHistory) {
		const { getAuditHistoryDetailMock } = await import('$lib/mocks/audit-history.mock');
		return getAuditHistoryDetailMock(id);
	}

	return apiClient<AuditHistoryDetail>(`${AUDIT_HISTORY_PATH}/${id}`, {}, fetchImpl);
}
