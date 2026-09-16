import { listQueueRequests } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;
const UNASSIGNED = 'unassigned';
// Analista sem professionalId (sem vínculo usuário↔profissional): UUID válido
// que não casa com nenhum profissional — a fila retorna lista vazia, sem
// exigir novo sentinela no contrato.
const NO_ASSIGNMENT = '00000000-0000-0000-0000-000000000000';
// professional_id é UUID no backend — numérico é rejeitado com 400.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Home por perfil: o Analista vê apenas as solicitações sob sua
// responsabilidade (assigneeId = professionalId da sessão); sem vínculo com
// profissional, a lista fica vazia. Os demais perfis internos seguem com o
// recorte do Administrador (sem responsável).
export const load: PageServerLoad = async ({ locals, fetch }) => {
	const user = locals.user;
	const isAnalyst = user?.role === 'Analista';

	let assigneeId: string | 'unassigned' = UNASSIGNED;

	if (isAnalyst && user) {
		assigneeId =
			user.professionalId && UUID_PATTERN.test(user.professionalId)
				? user.professionalId
				: NO_ASSIGNMENT;
	}

	const result = await listQueueRequests(
		{
			page: 1,
			pageSize: PAGE_SIZE,
			assigneeId
		},
		fetch
	);

	return { result, pageSize: PAGE_SIZE };
};
