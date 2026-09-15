import { listQueueRequests } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;
const UNASSIGNED = 'unassigned';

// Home por perfil: o Analista vê apenas as solicitações sob sua
// responsabilidade (assigneeId = professionalId da sessão); os demais perfis
// internos seguem com o recorte do Administrador (sem responsável).
export const load: PageServerLoad = async ({ locals, fetch }) => {
	const isAnalyst = locals.user?.role === 'Analista';

	const result = await listQueueRequests(
		{
			page: 1,
			pageSize: PAGE_SIZE,
			assigneeId: isAnalyst && locals.user ? locals.user.id : UNASSIGNED
		},
		fetch
	);

	return { result, pageSize: PAGE_SIZE };
};
