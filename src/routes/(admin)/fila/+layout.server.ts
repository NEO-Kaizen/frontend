import { getQueueMetrics } from '$lib/services/request.service';
import { guard } from '$lib/services/access.service';
import type { LayoutServerLoad } from './$types';

// Carregado no layout: não lê url/searchParams, então não refaz a cada ?page.
// Refresco direcionado via invalidate('app:queue-metrics').
export const load: LayoutServerLoad = async ({ depends, fetch, locals, url }) => {
	guard('queue:read', locals.user, url.pathname);
	depends('app:queue-metrics');

	const metricsResult = await getQueueMetrics(fetch);

	return { metricsResult };
};
