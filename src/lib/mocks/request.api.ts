import { ApiError } from '$lib/api/client';
import type {
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestSummary
} from '$lib/types/request';

import { mockRequests, mockRequestDetails } from './requests';

export function listRequestsMock(
	query: ListRequestsQuery
): Promise<PaginatedResponse<RequestSummary>> {
	let requests = [...mockRequests];

	if (query.email) {
		const email = query.email.toLowerCase().trim();

		requests = requests.filter((r) => r.corporateEmail.toLowerCase().trim() === email);
	}

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

	return Promise.resolve({
		data,
		page,
		pageSize,
		total,
		totalPages
	});
}

export function getRequestByProtocolMock(protocol: string): Promise<RequestDetail> {
	const normalized = protocol.toLowerCase().trim();

	const detail = mockRequestDetails.find((d) => d.protocol.toLowerCase().trim() === normalized);

	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}

	return Promise.resolve(detail);
}

