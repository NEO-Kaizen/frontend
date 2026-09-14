import { listQueueRequests } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch }) => {
	const result = await listQueueRequests(
		{ page: 1, pageSize: PAGE_SIZE, assigneeId: 'unassigned' },
		fetch
	);

	return { result, pageSize: PAGE_SIZE };
};
