import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { DashboardQuery, DashboardResponse } from '$lib/types/dashboard';

const DASHBOARD_PATH = '/reports/dashboard';

export async function getDashboard(
	query: DashboardQuery,
	fetchImpl?: typeof fetch
): Promise<DashboardResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.dashboard) {
		const { getDashboardMock } = await import('$lib/mocks/dashboard.mock');
		return getDashboardMock(query);
	}

	const params = new URLSearchParams();
	if (query.from) params.set('from', query.from);
	if (query.to) params.set('to', query.to);
	if (query.situation) params.set('situation', query.situation);
	if (query.statusId) params.set('statusId', query.statusId);
	if (query.categoryId) params.set('categoryId', query.categoryId);
	if (query.priorityId) params.set('priorityId', query.priorityId);

	const queryString = params.toString();
	const path = queryString ? `${DASHBOARD_PATH}?${queryString}` : DASHBOARD_PATH;

	return apiClient<DashboardResponse>(path, {}, fetchImpl);
}
