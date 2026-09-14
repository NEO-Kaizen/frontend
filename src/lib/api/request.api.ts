import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';

import type { QueueMetricsResponse, QueueQuery, QueueResponse } from '$lib/types/queue';
import type {
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestSummary,
	InternalRequestDetail
} from '$lib/types/request';
import type { QueueQuery, QueueResponse } from '$lib/types/queue';

const REQUESTS_PATH = '/requests';
const QUEUE_PATH = '/queue';

export async function createRequest(
	payload: CreateRequestPayload,
	files: Blob[] = []
): Promise<CreateRequestResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { createRequestMock } = await import('$lib/mocks/requests.mock');
		return createRequestMock(payload, files);
	}

	const formData = new FormData();
	formData.append('payload', JSON.stringify(payload));

	for (const file of files) {
		formData.append('attachments', file);
	}

	return apiClient<CreateRequestResponse>(REQUESTS_PATH, {
		method: 'POST',
		body: formData
	});
}

export async function listRequests(
	query: ListRequestsQuery
): Promise<PaginatedResponse<RequestSummary>> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { listRequestsMock } = await import('$lib/mocks/requests.mock');
		return listRequestsMock(query);
	}

	const params = new URLSearchParams();

	if (query.email) params.set('email', query.email);
	if (query.search) params.set('search', query.search);
	if (query.status) params.set('status', query.status);
	if (query.page !== undefined) params.set('page', String(query.page));
	if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));

	const qs = params.toString();
	const path = qs ? `${REQUESTS_PATH}?${qs}` : REQUESTS_PATH;

	return apiClient<PaginatedResponse<RequestSummary>>(path);
}

export async function listQueueRequests(query: QueueQuery): Promise<QueueResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { listQueueRequestsMock } = await import('$lib/mocks/requests.mock');
		return listQueueRequestsMock(query);
	}

	const params = new URLSearchParams();

	if (query.page !== undefined) params.set('page', String(query.page));
	if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));

	if (query.search) params.set('search', query.search);
	if (query.status) params.set('status', query.status);
	if (query.priority) params.set('priority', query.priority);

	if (query.assigneeId !== undefined) {
		params.set('assigneeId', String(query.assigneeId));
	}

	const qs = params.toString();
	const path = qs ? `${QUEUE_PATH}?${qs}` : QUEUE_PATH;

	return apiClient<QueueResponse>(path);
}

export async function getQueueMetrics(): Promise<QueueMetricsResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getQueueMetricsMock } = await import('$lib/mocks/requests.mock');
		return getQueueMetricsMock();
	}

	return apiClient<QueueMetricsResponse>(`${QUEUE_PATH}/metrics`);
}

export async function getRequestByProtocol(protocol: string): Promise<RequestDetail> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getRequestByProtocolMock } = await import('$lib/mocks/requests.mock');
		return getRequestByProtocolMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);

	return apiClient<RequestDetail>(`${REQUESTS_PATH}/${encoded}`);
}

export async function listQueue(query: QueueQuery): Promise<QueueResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { listQueueMock } = await import('$lib/mocks/requests.mock');
		return listQueueMock(query);
	}

	const params = new URLSearchParams();

	if (query.page !== undefined) params.set('page', String(query.page));
	if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
	if (query.search) params.set('search', query.search);
	if (query.status) params.set('status', query.status);
	if (query.priority) params.set('priority', query.priority);
	if (query.assigneeId !== undefined) params.set('assigneeId', String(query.assigneeId));

	const qs = params.toString();
	const path = qs ? `${QUEUE_PATH}?${qs}` : QUEUE_PATH;

	return apiClient<QueueResponse>(path);
}

export async function getInternalRequest(protocol: string): Promise<InternalRequestDetail> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getInternalRequestMock } = await import('$lib/mocks/requests.mock');
		return getInternalRequestMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<InternalRequestDetail>(`${REQUESTS_PATH}/${encoded}/internal`);
}
