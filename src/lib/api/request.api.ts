import { apiClient } from './client';

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
	return apiClient<QueueMetricsResponse>(`${QUEUE_PATH}/metrics`, {}, fetchImpl);
}

export async function getRequestByProtocol(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<RequestDetail> {
	const encoded = encodeURIComponent(protocol);

	return apiClient<RequestDetail>(`${REQUESTS_PATH}/${encoded}`, {}, fetchImpl);
}

export async function getInternalRequest(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<InternalRequestDetail> {
	const encoded = encodeURIComponent(protocol);
	return apiClient<InternalRequestDetail>(`${REQUESTS_PATH}/${encoded}/internal`, {}, fetchImpl);
}

// PATCH /requests/:protocol/internal (método proposto — o backend definirá o
// contrato final).
export async function updateInternalRequest(
	protocol: string,
	payload: UpdateInternalRequestPayload,
	fetchImpl?: typeof fetch
): Promise<InternalRequestDetail> {
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
