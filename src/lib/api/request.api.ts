import { apiClient } from './client';

import { listRequestsMock, getRequestByProtocolMock } from '$lib/mocks/request.api';

import type {
	ListRequestsQuery,
	PaginatedResponse,
	RequestSummary,
	RequestDetail
} from '$lib/types/request';

const REQUESTS_PATH = '/requests';

// TODO: Substituir o mock pela integração com a API quando o backend estiver disponível.
const USE_MOCK = true;

export function listRequests(query: ListRequestsQuery): Promise<PaginatedResponse<RequestSummary>> {
	if (USE_MOCK) {
		return listRequestsMock(query);
	}

	const params = new URLSearchParams();

	params.set('email', query.email);

	if (query.search) params.set('search', query.search);
	if (query.status) params.set('status', query.status);
	if (query.page !== undefined) params.set('page', String(query.page));
	if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));

	const qs = params.toString();
	const path = qs ? `${REQUESTS_PATH}?${qs}` : REQUESTS_PATH;

	return apiClient<PaginatedResponse<RequestSummary>>(path);
}

export function getRequestByProtocol(protocol: string): Promise<RequestDetail> {
	if (USE_MOCK) {
		return getRequestByProtocolMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<RequestDetail>(`${REQUESTS_PATH}/${encoded}`);
}
