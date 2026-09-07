import { listRequests } from '$lib/services/request.service';
import type { PageLoad } from './$types';

const PAGE_SIZE = 5;

// Dados da tabela dependem exclusivamente da URL: rerun de load é automático
// ao mudar ?email/?page, com cancelamento e estado "navegando" nativos.
export const load: PageLoad = async ({ url }) => {
	const email = url.searchParams.get('email') ?? '';
	const pageParam = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	if (!email) {
		return { email, page: 1, resultado: null };
	}

	const resultado = await listRequests({ email, page, pageSize: PAGE_SIZE });

	return { email, page, resultado };
};
