import { getConversation } from '$lib/services/conversation.service';
import { getInternalRequest } from '$lib/services/request.service';
import type { PageServerLoad } from './$types';

// Server load (não universal): o fetch sai do servidor sem o modelo CORS do
// browser, que o SvelteKit aplica em loads universais cross-origin. Também
// garante o cookie da sessão na chamada ao backend.
export const load: PageServerLoad = async ({ params, fetch }) => {
	const protocol = params.protocolo;

	const [requestResult, conversationResult] = await Promise.all([
		getInternalRequest(protocol, fetch),
		getConversation(protocol, fetch)
	]);

	if (requestResult.ok) {
		return {
			protocol,
			solicitation: requestResult.data,
			error: null,
			conversationResult
		};
	}

	return {
		protocol,
		solicitation: null,
		error: requestResult.error,
		conversationResult
	};
};
