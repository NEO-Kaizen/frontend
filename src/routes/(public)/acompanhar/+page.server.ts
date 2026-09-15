import { listRequests } from '$lib/services/request.service';
import { parsePageParam, redirectToValidPage } from '$lib/utils/pagination';

import type { PageServerLoad } from './$types';

const PAGE_SIZE = 5;

// Server load (não universal): rerun automático ao mudar ?email/?page e o fetch
// sai do servidor sem o modelo CORS do browser aplicado a loads universais.
export const load: PageServerLoad = async ({ url, fetch }) => {
	const email = url.searchParams.get('email') ?? '';
	const page = parsePageParam(url.searchParams.get('page'));

	if (!email) {
		return { email, page: 1, result: null };
	}

	const result = await listRequests({ email, page, pageSize: PAGE_SIZE }, fetch);

	if (result.ok) {
		redirectToValidPage(url, page, result.data.totalPages);
	}

	return { email, page, result };
};
