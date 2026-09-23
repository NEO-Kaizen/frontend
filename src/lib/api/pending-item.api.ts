import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import { ApiError } from '$lib/types/result';

import type {
	CreatePendingItemsBody,
	CreatePendingItemsResponse,
	ListPendenciesResponse,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';

// Contrato de pendências (contract-pendencias v0.5).
function pendingItemsPath(protocol: string): string {
	const encoded = encodeURIComponent(protocol);
	return `/requests/${encoded}/pending-items`;
}

// Leitura da listagem para a aba de histórico do analista —
// GET /requests/:protocol/pending-items (contrato v0.5 §7). Retorna
// `PendingItem[]` direto, sem envelope e sem query (lista curta, cronológica;
// o front agrupa por `batchId`). Em DEV o mock responde; em produção depende
// do backend expor a listagem (fora do mock, 501 tratado no service).
// `fetchImpl` é o fetch do `load` quando chamado no servidor.
export async function getPendingItems(
	protocol: string,
	// Recebido por compatibilidade de assinatura SSR (o `apiClient` exige o
	// fetch do `load` no servidor); será encaminhado quando o backend expuser
	// a listagem. O mock em memória não precisa de fetch.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	fetchImpl?: typeof fetch
): Promise<ListPendenciesResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { listPendingItemsMock } = await import('$lib/mocks/pendency.mock');
		return listPendingItemsMock(protocol);
	}

	throw new ApiError(501, 'Listagem de pendências indisponível fora do mock.');
}

// Criação do lote — POST /requests/:protocol/pending-items (contrato v0.5 §6).
export async function createPendingItems(
	protocol: string,
	payload: CreatePendingItemsBody,
	fetchImpl?: typeof fetch
): Promise<CreatePendingItemsResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { createPendingItemsMock } = await import('$lib/mocks/pendency.mock');
		return createPendingItemsMock(protocol, payload);
	}

	return apiClient<CreatePendingItemsResponse>(
		pendingItemsPath(protocol),
		{
			method: 'POST',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}

// Revisão parcial do lote — PATCH /requests/:protocol/pending-items/review
// (contrato v0.5 §9). Envia somente os itens decididos; os demais permanecem
// `responded` para revisão posterior (regra D-P23).
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
			method: 'PATCH',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}
