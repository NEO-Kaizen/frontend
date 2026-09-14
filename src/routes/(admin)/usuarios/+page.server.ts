import { listUsers } from '$lib/services/user.service';
import { guard } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	guard('adminOnly', locals.user, url.pathname);

	const result = await listUsers({ page: 1, pageSize: PAGE_SIZE }, fetch);

	return { result, pageSize: PAGE_SIZE };
};
