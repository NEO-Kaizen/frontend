import { getUserStats, listUsers } from '$lib/services/user.service';
import { guard } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	guard('adminOnly', locals.user, url);

	const [result, stats] = await Promise.all([
		listUsers({ page: 1, pageSize: PAGE_SIZE }, fetch),
		getUserStats(fetch)
	]);

	return { result, stats, pageSize: PAGE_SIZE };
};
