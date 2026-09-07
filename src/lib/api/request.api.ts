import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestSummary,
	RequestDetail
} from '$lib/types/request';

const REQUESTS_PATH = '/requests';

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
	query: ListRequestsQuery
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

	return apiClient<PaginatedResponse<RequestSummary>>(path);
}

export async function getRequestByProtocol(protocol: string): Promise<RequestDetail> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getRequestByProtocolMock } = await import('$lib/mocks/requests.mock');
		return getRequestByProtocolMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<RequestDetail>(`${REQUESTS_PATH}/${encoded}`);
}
