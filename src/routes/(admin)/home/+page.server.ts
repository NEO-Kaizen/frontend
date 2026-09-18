import { listQueueRequests } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const assigneeId = locals.user?.role === 'Analista' ? String(locals.user.id) : 'unassigned';

	const result = await listQueueRequests(
		{
			page: 1,
			pageSize: PAGE_SIZE,
			assigneeId
		},
		fetch
	);

	return { result, pageSize: PAGE_SIZE };
};
