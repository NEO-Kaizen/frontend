import { getQueueMetrics } from '$lib/services/request.service';

import type { LayoutServerLoad } from './$types';

// Métricas são globais (não dependem da URL): no layout server load elas são
// buscadas uma vez e não rerodam a cada mudança de filtro/paginação da página.
export const load: LayoutServerLoad = async () => {
	const metricsResult = await getQueueMetrics();

	return { metricsResult };
};
