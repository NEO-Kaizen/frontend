import { getInternalRequest } from '$lib/services/request.service';
import { getInternalNotes } from '$lib/services/internal-note.service';
import { listPendencies } from '$lib/services/pendency.service';
import { has } from '$lib/utils/permission-checks';
import type { PageServerLoad } from './$types';

// Server load (não universal): o fetch sai do servidor sem o modelo CORS do
// browser, que o SvelteKit aplica em loads universais cross-origin. Também
// garante o cookie da sessão na chamada ao backend.
export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const protocol = params.protocolo;
	const canReadInternalNotes = has('internal_note:read', locals.user);
	const canReadPendencies = has('pending_item:read', locals.user);

	const internalNotesPromise: Promise<Awaited<ReturnType<typeof getInternalNotes>> | null> =
		canReadInternalNotes ? getInternalNotes(protocol, {}, fetch) : Promise.resolve(null);
	const pendenciesPromise: Promise<Awaited<ReturnType<typeof listPendencies>> | null> =
		canReadPendencies ? listPendencies(protocol, fetch) : Promise.resolve(null);

	const [result, internalNotesResult, pendenciesResult] = await Promise.all([
		getInternalRequest(protocol, fetch),
		internalNotesPromise,
		pendenciesPromise
	]);

	const internalNotes = internalNotesResult?.ok ? internalNotesResult.data : null;
	const internalNotesError = !canReadInternalNotes
		? 'Você não tem permissão para visualizar observações internas.'
		: internalNotesResult && !internalNotesResult.ok
			? internalNotesResult.error.message
			: null;

	const pendencies = pendenciesResult?.ok ? pendenciesResult.data : null;
	const pendenciesError = !canReadPendencies
		? 'Você não tem permissão para visualizar pendências.'
		: pendenciesResult && !pendenciesResult.ok
			? pendenciesResult.error.message
			: null;

	if (result.ok) {
		return {
			protocol,
			solicitation: result.data,
			error: null,
			internalNotes,
			internalNotesError,
			pendencies,
			pendenciesError
		};
	}

	return {
		protocol,
		solicitation: null,
		error: result.error,
		internalNotes,
		internalNotesError,
		pendencies,
		pendenciesError
	};
};
