import { getInternalRequest } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

// Server load (não universal): o fetch sai do servidor sem o modelo CORS do
// browser, que o SvelteKit aplica em loads universais cross-origin. Também
// garante o cookie da sessão na chamada ao backend.
export const load: PageServerLoad = async ({ params, fetch }) => {
	const protocol = params.protocolo;

	const result = await getInternalRequest(protocol, fetch);

	if (result.ok) {
		return {
			protocol,
			solicitation: result.data,
			error: null
		};
	}

	return {
		protocol,
		solicitation: null,
		error: result.error
	};
};
