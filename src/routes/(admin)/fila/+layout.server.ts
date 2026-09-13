import { getQueueMetrics } from '$lib/services/request.service';
import type { LayoutServerLoad } from './$types';

// Carregado no layout: não lê url/searchParams, então não refaz a cada ?page.
// Refresco direcionado via invalidate('app:queue-metrics').
export const load: LayoutServerLoad = async ({ depends }) => {
	depends('app:queue-metrics');

	const metricsResult = await getQueueMetrics();

	return { metricsResult };
};
