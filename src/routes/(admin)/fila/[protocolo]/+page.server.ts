import { redirect } from '@sveltejs/kit';
import { getInternalRequest } from '$lib/services/request.service';
import { getInternalNotes } from '$lib/services/internal-note.service';
import { listPendencies } from '$lib/services/pendency.service';
import { can, canAccessResponsible, has } from '$lib/utils/permission-checks';
import type { PageServerLoad } from './$types';

// Server load (não universal): o fetch sai do servidor sem o modelo CORS do
// browser, que o SvelteKit aplica em loads universais cross-origin. Também
// garante o cookie da sessão na chamada ao backend.
export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const protocol = params.protocolo;
	const user = locals.user;
	if (!user) redirect(303, '/login');

	const canReadAny = can('request:read', 'all', user);
	const canReadAssigned = can('request:read', 'assigned', user);
	if (!canReadAny && !canReadAssigned) redirect(303, '/sem-autorizacao');

	const canReadInternalNotes = has('internal_note:read', user);
	const canReadPendencies = has('pending_item:read', user);

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
	let internalNotesError = !canReadInternalNotes
		? 'Você não tem permissão para visualizar observações internas.'
		: internalNotesResult && !internalNotesResult.ok
			? internalNotesResult.error.message
			: null;

	const pendencies = pendenciesResult?.ok ? pendenciesResult.data : null;
	let pendenciesError = !canReadPendencies
		? 'Você não tem permissão para visualizar pendências.'
		: pendenciesResult && !pendenciesResult.ok
			? pendenciesResult.error.message
			: null;

	if (result.ok) {
		const detail = result.data;
		// `request:read` na custódia `assigned` alcança apenas o Responsável da
		// solicitação (`assignee_user_id`); o responsável do mapeamento não conta.
		const isRequestResponsible = detail.assignee?.id === user.id;
		if (!canReadAny && !isRequestResponsible) redirect(303, '/sem-autorizacao');

		// As abas de notas e pendências também seguem a custódia da linha, não
		// apenas a chave. Sem isso, um `assigned` não responsável veria a aba e
		// receberia 403 do backend.
		const canViewInternalNotes = canAccessResponsible(
			'internal_note:read',
			user,
			detail.assignee?.id
		);
		const canViewPendencies = canAccessResponsible('pending_item:read', user, detail.assignee?.id);
		if (canReadInternalNotes && !canViewInternalNotes) {
			internalNotesError = null;
		}
		if (canReadPendencies && !canViewPendencies) {
			pendenciesError = null;
		}

		return {
			protocol,
			solicitation: detail,
			error: null,
			internalNotes: canViewInternalNotes ? internalNotes : null,
			internalNotesError,
			pendencies: canViewPendencies ? pendencies : null,
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
