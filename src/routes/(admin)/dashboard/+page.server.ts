import { guard } from '$lib/services/access.service';
import { loadDashboard } from '$lib/services/dashboard.service';
import type { DashboardQuery, DashboardSituation } from '$lib/types/dashboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	guard('managementOnly', locals.user, url.pathname);

	const filters: DashboardQuery = {
		from: url.searchParams.get('from') || undefined,
		to: url.searchParams.get('to') || undefined,
		situation: (url.searchParams.get('situation') as DashboardSituation | null) || undefined,
		statusId: url.searchParams.get('statusId') || undefined,
		categoryId: url.searchParams.get('categoryId') || undefined,
		priorityId: url.searchParams.get('priorityId') || undefined
	};

	return {
		result: await loadDashboard(filters, fetch),
		filters
	};
};
