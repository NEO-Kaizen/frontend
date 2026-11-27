import { listQueueRequests } from '$lib/services/request.service';
import { can, guard } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	guard('queue:read', locals.user, url.pathname);
	const user = locals.user;
	let assigneeId = 'unassigned';
	if (user && can('queue:read', 'assigned', user) && !can('queue:read', 'all', user)) {
		assigneeId = String(user.id);
	}

	const result = await listQueueRequests(
		{
			page: 1,
			pageSize: PAGE_SIZE,
			assigneeId
		},
		fetch
	);

	return { result, pageSize: PAGE_SIZE, assigneeId };
};
