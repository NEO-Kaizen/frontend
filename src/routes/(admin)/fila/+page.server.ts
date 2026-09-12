import { getQueueMetrics, listQueueRequests } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 5;

export const load: PageServerLoad = async ({ url }) => {
	const pageParam = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const [result, metricsResult] = await Promise.all([
		listQueueRequests({ page, pageSize: PAGE_SIZE }),
		getQueueMetrics()
	]);

	return { page, result, metricsResult };
};
