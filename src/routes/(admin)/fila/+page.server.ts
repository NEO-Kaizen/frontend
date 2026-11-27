import { listQueueRequests } from '$lib/services/request.service';
import { parsePageParam } from '$lib/utils/pagination';
import { parseQueueFilterQuery } from '$lib/utils/queue-filters';

import type { QueueQuery } from '$lib/types/queue';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 5;

function buildQueueQuery(params: URLSearchParams, page: number): QueueQuery {
	return { page, pageSize: PAGE_SIZE, ...parseQueueFilterQuery(params) };
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	const requestedPage = parsePageParam(url.searchParams.get('page'));
	const query = buildQueueQuery(url.searchParams, requestedPage);

	const result = await listQueueRequests(query, fetch);

	// O backend clampa `page` ao intervalo válido; a página efetiva vem da resposta.
	const page = result.ok ? result.data.page : requestedPage;

	return { page, result };
};
