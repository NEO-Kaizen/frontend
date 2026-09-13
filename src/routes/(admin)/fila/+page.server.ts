import { getQueueMetrics, listQueueRequests } from '$lib/services/request.service';
import { parsePageParam, redirectToValidPage } from '$lib/utils/pagination';

import type { QueueQuery } from '$lib/types/queue';
import type { RequestPriority, RequestStatus } from '$lib/types/request';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 5;
const ALL_FILTER = 'all';
const UNASSIGNED_FILTER = 'unassigned';

function buildQueueQuery(url: URL, page: number): QueueQuery {
	const params = url.searchParams;
	const query: QueueQuery = { page, pageSize: PAGE_SIZE };

	const search = params.get('search')?.trim();

	if (search) {
		query.search = search;
	}

	const status = params.get('status');

	if (status && status !== ALL_FILTER) {
		query.status = status as RequestStatus;
	}

	const priority = params.get('priority');

	if (priority && priority !== ALL_FILTER) {
		query.priority = priority as RequestPriority;
	}

	const assigneeId = params.get('assigneeId');

	if (assigneeId === UNASSIGNED_FILTER) {
		query.assigneeId = UNASSIGNED_FILTER;
	} else if (assigneeId && Number.isInteger(Number(assigneeId))) {
		query.assigneeId = Number(assigneeId);
	}

	return query;
}

export const load: PageServerLoad = async ({ url }) => {
	const page = parsePageParam(url.searchParams.get('page'));
	const query = buildQueueQuery(url, page);

	const [result, metricsResult] = await Promise.all([listQueueRequests(query), getQueueMetrics()]);

	if (result.ok) {
		redirectToValidPage(url, page, result.data.totalPages);
	}

	return { page, result, metricsResult };
};
