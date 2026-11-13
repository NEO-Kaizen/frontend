import { listQueueRequests } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const isAnalyst = locals.user?.role === 'Analista';

	const result = await listQueueRequests(
		{
			page: 1,
			pageSize: PAGE_SIZE,
			// Analista: o backend já restringe ao escopo de responsabilidade
			// (triagem OU mapeamento, issue #102). Enviar `assigneeId` limitaria
			// à triagem e esconderia as solicitações em que ele é o mapeador.
			...(isAnalyst ? {} : { assigneeId: 'unassigned' })
		},
		fetch
	);

	return { result, pageSize: PAGE_SIZE, assigneeId: isAnalyst ? undefined : 'unassigned' };
};
