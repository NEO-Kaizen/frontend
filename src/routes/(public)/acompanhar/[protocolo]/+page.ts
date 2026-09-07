import { getRequestByProtocol } from '$lib/services/request.service';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const protocol = params.protocolo;
	const result = await getRequestByProtocol(protocol);

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
