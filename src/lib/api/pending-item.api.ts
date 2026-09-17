import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';

import type {
	CreatePendencyPayload,
	CreatePendencyResponse,
	ListPendenciesQuery,
	ListPendenciesResponse,
	PendingItem,
	ReopenPendencyPayload,
	ValidatePendencyPayload
} from '$lib/types/pendency';

// Contrato proposto para o ciclo de pendências por campo (backend em definição).
function pendingItemsPath(protocol: string): string {
	const encoded = encodeURIComponent(protocol);
	return `/requests/${encoded}/pending-items`;
}

export async function getPendingItems(
	protocol: string,
	query: ListPendenciesQuery = {},
	fetchImpl?: typeof fetch
): Promise<ListPendenciesResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { listPendingItemsMock } = await import('$lib/mocks/pendency.mock');
		return listPendingItemsMock(protocol, query);
	}

	const params = new URLSearchParams();

	if (query.status) params.set('status', query.status);
	if (query.page !== undefined) params.set('page', String(query.page));
	if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));

	const qs = params.toString();
	const path = qs ? `${pendingItemsPath(protocol)}?${qs}` : pendingItemsPath(protocol);

	return apiClient<ListPendenciesResponse>(path, {}, fetchImpl);
}

// POST /requests/:protocol/pending-items — cria as pendências por campo e muda o
// status da solicitação para "Pendente de informações" (transação no backend).
// O corpo é JSON: somente justificativas (sem anexos no fluxo atual).
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

// POST /pending-items/:id/validate — aplica o valor corrigido e fecha o ciclo.
export async function validatePendingItem(
	protocol: string,
	id: string,
	payload: ValidatePendencyPayload = {},
	fetchImpl?: typeof fetch
): Promise<PendingItem> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { validatePendingItemMock } = await import('$lib/mocks/pendency.mock');
		return validatePendingItemMock(protocol, id);
	}

	return apiClient<PendingItem>(
		`${pendingItemsPath(protocol)}/${encodeURIComponent(id)}/validate`,
		{
			method: 'POST',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}

// POST /pending-items/:id/reopen — "Solicitar novamente": reabre o ciclo.
export async function reopenPendingItem(
	protocol: string,
	id: string,
	payload: ReopenPendencyPayload,
	fetchImpl?: typeof fetch
): Promise<PendingItem> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const { reopenPendingItemMock } = await import('$lib/mocks/pendency.mock');
		return reopenPendingItemMock(protocol, id, payload);
	}

	return apiClient<PendingItem>(
		`${pendingItemsPath(protocol)}/${encodeURIComponent(id)}/reopen`,
		{
			method: 'POST',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}
