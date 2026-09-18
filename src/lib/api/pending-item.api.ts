import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import { ApiError } from '$lib/types/result';

import type {
	CreatePendencyPayload,
	CreatePendencyResponse,
	ListPendenciesQuery,
	ListPendenciesResponse,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';

// Contrato BACKEND-CONTRATO-PENDENCIAS-POR-CAMPO-0_2.md.
function pendingItemsPath(protocol: string): string {
	const encoded = encodeURIComponent(protocol);
	return `/requests/${encoded}/pending-items`;
}

// §4: o contrato não define GET dedicado — a leitura real vem do canal/detalhe
// interno (#125) e do `correctionAlert`. Disponível apenas via mock em DEV.
export async function getPendingItems(
	protocol: string,
	query: ListPendenciesQuery = {}
): Promise<ListPendenciesResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { listPendingItemsMock } = await import('$lib/mocks/pendency.mock');
		return listPendingItemsMock(protocol, query);
	}

	throw new ApiError(501, 'Listagem de pendências indisponível fora do mock.');
}

// §1 — POST /requests/:protocol/pending-items.
export async function createPendingItems(
	protocol: string,
	payload: CreatePendencyPayload,
	fetchImpl?: typeof fetch
): Promise<CreatePendencyResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { createPendingItemsMock } = await import('$lib/mocks/pendency.mock');
		return createPendingItemsMock(protocol, payload);
	}

	return apiClient<CreatePendencyResponse>(
		pendingItemsPath(protocol),
		{
			method: 'POST',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}

// §3 — POST /requests/:protocol/pending-items/review (revisão em lote).
export async function reviewPendingItems(
	protocol: string,
	payload: ReviewPendingItemsBody,
	fetchImpl?: typeof fetch
): Promise<ReviewPendingItemsResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { reviewPendingItemsMock } = await import('$lib/mocks/pendency.mock');
		return reviewPendingItemsMock(protocol, payload);
	}

	return apiClient<ReviewPendingItemsResponse>(
		`${pendingItemsPath(protocol)}/review`,
		{
			method: 'POST',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}
