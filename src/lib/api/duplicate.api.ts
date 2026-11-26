import { apiClient, requesterIdentityHeaders } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { DuplicateCheckRequest, DuplicateCheckResponse } from '$lib/types/duplicate';
import type { DemandBlock } from '$lib/types/request';
import type { RequesterIdentity } from '$lib/types/requester-tracking';

const REQUESTS_PATH = '/requests';

// POST /requests/duplicates/check — público no modo PUBLIC e autenticado no
// modo AUTHENTICATED. O backend nunca ecoa o texto enviado; falha de busca,
// flag desligada ou índice indisponível degradam para
// `{ confidence: 'none', items: [] }`. Erros HTTP continuam como `ApiError`
// (padrão do apiClient) para a UI decidir como degradar.
export async function checkDuplicates(
	demand: DemandBlock,
	fetchImpl?: typeof fetch
): Promise<DuplicateCheckResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.duplicates) {
		const { checkDuplicatesMock } = await import('$lib/mocks/duplicate.mock');
		return checkDuplicatesMock();
	}

	const payload: DuplicateCheckRequest = { demand };

	return apiClient<DuplicateCheckResponse>(
		`${REQUESTS_PATH}/duplicates/check`,
		{ method: 'POST', body: JSON.stringify(payload) },
		fetchImpl
	);
}

// GET /requests/:protocol/duplicates — mesmo DTO do alerta, no máximo 5 itens.
// Fluxo público: a identidade vira `X-Requester-Identity` (construtor único em
// `client.ts`). Fluxo autenticado: `identity` ausente/null e o cookie de sessão
// segue no `credentials: "include"` padrão do apiClient.
export async function getTrackingDuplicates(
	protocol: string,
	identity?: RequesterIdentity | null,
	fetchImpl?: typeof fetch
): Promise<DuplicateCheckResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.duplicates) {
		const { getTrackingDuplicatesMock } = await import('$lib/mocks/duplicate.mock');
		return getTrackingDuplicatesMock();
	}

	const encoded = encodeURIComponent(protocol);

	return apiClient<DuplicateCheckResponse>(
		`${REQUESTS_PATH}/${encoded}/duplicates`,
		{ headers: requesterIdentityHeaders(identity) },
		fetchImpl
	);
}
