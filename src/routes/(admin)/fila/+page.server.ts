import { listQueueRequests } from '$lib/services/request.service';
import { parsePageParam, redirectToValidPage } from '$lib/utils/pagination';

import type { PageServerLoad } from './$types';

const PAGE_SIZE = 5;

export const load: PageServerLoad = async ({ url }) => {
	const page = parsePageParam(url.searchParams.get('page'));

	const result = await listQueueRequests({ page, pageSize: PAGE_SIZE });

	if (result.ok) {
		redirectToValidPage(url, page, result.data.totalPages);
	}

	return { page, result };
};
