import { getInternalRequest } from '$lib/services/request.service';
import { getInternalNotes } from '$lib/services/internal-note.service';
import { listPendencies } from '$lib/services/pendency.service';
import type { PageServerLoad } from './$types';

// Server load (não universal): o fetch sai do servidor sem o modelo CORS do
// browser, que o SvelteKit aplica em loads universais cross-origin. Também
// garante o cookie da sessão na chamada ao backend.
export const load: PageServerLoad = async ({ params, fetch }) => {
	const protocol = params.protocolo;

	const [result, internalNotesResult, pendenciesResult] = await Promise.all([
		getInternalRequest(protocol, fetch),
		getInternalNotes(protocol, fetch),
		listPendencies(protocol, fetch)
	]);

	// A leitura de pendências segue o contrato v0.4: em DEV o mock responde; em
	// produção, sem endpoint dedicado de listagem, o histórico exibe o estado
	// de erro com retry em vez de quebrar a página.
	const pendencies = pendenciesResult.ok ? pendenciesResult.data : null;
	const pendenciesError = pendenciesResult.ok ? null : pendenciesResult.error.message;

	if (result.ok) {
		return {
			protocol,
			solicitation: result.data,
			error: null,
			internalNotes: internalNotesResult.ok ? internalNotesResult.data : null,
			internalNotesError: internalNotesResult.ok ? null : internalNotesResult.error.message,
			pendencies,
			pendenciesError
		};
	}

	return {
		protocol,
		solicitation: null,
		error: result.error,
		internalNotes: null,
		internalNotesError: null,
		pendencies,
		pendenciesError
	};
};
