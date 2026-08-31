import { apiClient } from './client';
import type {
	ListRequestsQuery,
	PaginatedResponse,
	RequestSummary,
	RequestDetail
} from '$lib/types/request';
import { mockRequests, mockRequestDetails } from '$lib/mocks/requests';

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


// Funções mock temporárias para simulação da API.
function listRequestsMock(query: ListRequestsQuery): Promise<PaginatedResponse<RequestSummary>> {
	let requests = [...mockRequests];

	const email = query.email.toLowerCase().trim();
	requests = requests.filter((r) => r.corporateEmail.toLowerCase().trim() === email);

	if (query.search) {
		const search = query.search.toLowerCase().trim();
		requests = requests.filter(
			(r) =>
				r.processName.toLowerCase().includes(search) ||
				r.requesterName.toLowerCase().includes(search) ||
				r.corporateEmail.toLowerCase().includes(search)
		);
	}

	if (query.status) {
		requests = requests.filter((r) => r.status === query.status);
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 10;
	const total = requests.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;
	const data = requests.slice(start, start + pageSize);

	const result: PaginatedResponse<RequestSummary> = { data, page, pageSize, total, totalPages };
	return Promise.resolve(result);
}

function getRequestByProtocolMock(protocol: string): Promise<RequestDetail> {
	const normalized = protocol.toLowerCase().trim();
	const detail = mockRequestDetails.find((d) => d.protocol.toLowerCase().trim() === normalized);

	if (!detail) {
		return Promise.reject(new Error('Solicitação não encontrada'));
	}

	return Promise.resolve(detail);
}
