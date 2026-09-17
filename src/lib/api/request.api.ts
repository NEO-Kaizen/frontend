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
	InternalRequestDetail,
	UpdateInternalRequestPayload
} from '$lib/types/request';

const REQUESTS_PATH = '/requests';
const QUEUE_PATH = '/queue';

// POST /requests — envia o formulário (parte textual "payload") e os anexos
// (0 a 5 partes binárias "attachments") num único multipart/form-data.
export async function createRequest(
	payload: CreateRequestPayload,
	files: Blob[] = []
): Promise<CreateRequestResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
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
	query: ListRequestsQuery,
	fetchImpl?: typeof fetch
): Promise<PaginatedResponse<RequestSummary>> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { listRequestsMock } = await import('$lib/mocks/requests.mock');
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

	return apiClient<PaginatedResponse<RequestSummary>>(path, {}, fetchImpl);
}

export async function listQueueRequests(
	query: QueueQuery,
	fetchImpl?: typeof fetch
): Promise<QueueResponse> {
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
	if (query.priority !== undefined) params.set('priority', query.priority);

	if (query.assigneeId !== undefined) {
		params.set('assigneeId', String(query.assigneeId));
	}

	const qs = params.toString();
	const path = qs ? `${QUEUE_PATH}?${qs}` : QUEUE_PATH;

	return apiClient<QueueResponse>(path, {}, fetchImpl);
}

export async function getQueueMetrics(fetchImpl?: typeof fetch): Promise<QueueMetricsResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getQueueMetricsMock } = await import('$lib/mocks/requests.mock');
		return getQueueMetricsMock();
	}

	return apiClient<QueueMetricsResponse>(`${QUEUE_PATH}/metrics`, {}, fetchImpl);
}

export async function getRequestByProtocol(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<RequestDetail> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getRequestByProtocolMock } = await import('$lib/mocks/requests.mock');
		return getRequestByProtocolMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);

	return apiClient<RequestDetail>(`${REQUESTS_PATH}/${encoded}`, {}, fetchImpl);
}

export async function getInternalRequest(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<InternalRequestDetail> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getInternalRequestMock } = await import('$lib/mocks/requests.mock');
		return getInternalRequestMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<InternalRequestDetail>(`${REQUESTS_PATH}/${encoded}/internal`, {}, fetchImpl);
}

// PATCH /requests/:protocol/internal (método proposto — o backend definirá o
// contrato final). Em DEV com mock, mescla no fixture em memória.
export async function updateInternalRequest(
	protocol: string,
	payload: UpdateInternalRequestPayload,
	fetchImpl?: typeof fetch
): Promise<InternalRequestDetail> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { updateInternalRequestMock } = await import('$lib/mocks/requests.mock');
		return updateInternalRequestMock(protocol, payload);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<InternalRequestDetail>(
		`${REQUESTS_PATH}/${encoded}/internal`,
		{
			method: 'PATCH',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}

export async function assignAnalyst(
	protocol: string,
	analystId: string,
	fetchImpl?: typeof fetch
): Promise<InternalRequestDetail> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { assignAnalystMock } = await import('$lib/mocks/requests.mock');
		return assignAnalystMock(protocol, analystId);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<InternalRequestDetail>(
		`${REQUESTS_PATH}/${encoded}/internal/assignee`,
		{
			method: 'PATCH',
			body: JSON.stringify({ analystId })
		},
		fetchImpl
	);
}
