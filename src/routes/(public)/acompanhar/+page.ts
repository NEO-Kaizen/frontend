import { listRequests } from '$lib/services/request.service';
import { parsePageParam, redirectToValidPage } from '$lib/utils/pagination';

import type { PageLoad } from './$types';

const PAGE_SIZE = 5;

// Dados da tabela dependem exclusivamente da URL: rerun de load é automático
// ao mudar ?email/?page, com cancelamento e estado "navegando" nativos.
export const load: PageLoad = async ({ url }) => {
	const email = url.searchParams.get('email') ?? '';
	const page = parsePageParam(url.searchParams.get('page'));

	if (!email) {
		return { email, page: 1, result: null };
	}

	const result = await listRequests({ email, page, pageSize: PAGE_SIZE });

	if (result.ok) {
		redirectToValidPage(url, page, result.data.totalPages);
	}

	return { email, page, result };
};
