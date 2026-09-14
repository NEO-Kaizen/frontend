import { getRequestByProtocol } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

// Server load (não universal): evita o modelo CORS do browser em fetch
// cross-origin no SSR e mantém o cookie quando houver sessão.
export const load: PageServerLoad = async ({ params, fetch }) => {
	const protocol = params.protocolo;
	const result = await getRequestByProtocol(protocol, fetch);

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
