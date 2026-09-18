import {
	createPendingItems as createPendingItemsApi,
	getPendingItems as getPendingItemsApi,
	reviewPendingItems as reviewPendingItemsApi
} from '$lib/api/pending-item.api';

import type {
	CreatePendencyPayload,
	CreatePendencyResponse,
	ListPendenciesQuery,
	ListPendenciesResponse,
	PendencyGroup,
	PendingItem,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';
import { ApiError, type Result } from '$lib/types/result';

export async function listPendencies(
	protocol: string,
	query: ListPendenciesQuery = {}
): Promise<Result<ListPendenciesResponse>> {
	try {
		const data = await getPendingItemsApi(protocol, query);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: 'Não foi possível carregar as pendências por campo.'
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// §1 — envia a solicitação de alteração por campo (lote) e muda o status para
// "Pendente de informações". Validação espelhada no mock/backend.
export async function requestFieldChange(
	protocol: string,
	payload: CreatePendencyPayload,
	fetchImpl?: typeof fetch
): Promise<Result<CreatePendencyResponse>> {
	const validation = validateCreatePayload(payload);
	if (validation) {
		return { ok: false, error: { message: validation } };
	}

	try {
		const data = await createPendingItemsApi(protocol, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 403
					? 'Você não tem permissão para solicitar alterações nesta tratativa.'
					: error.status === 409
						? 'Esta solicitação não permite novas pendências no estado atual.'
						: error.status === 404
							? 'Solicitação não encontrada.'
							: 'Não foi possível solicitar a alteração.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// §3 — "Revisar alterações": decide CADA item `responded` de um lote em uma
// única chamada atômica (validar fecha; reabrir solicita novamente).
export async function reviewPendingItems(
	protocol: string,
	payload: ReviewPendingItemsBody,
	fetchImpl?: typeof fetch
): Promise<Result<ReviewPendingItemsResponse>> {
	const validation = validateReviewPayload(payload);
	if (validation) {
		return { ok: false, error: { message: validation } };
	}

	try {
		const data = await reviewPendingItemsApi(protocol, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 403
					? 'Você não tem permissão para revisar pendências nesta tratativa.'
					: error.status === 409
						? 'Algum item desta revisão não está aguardando resposta.'
						: 'Não foi possível concluir a revisão.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// ---- Regras puras do ciclo (consumidas também pela camada visual de #125) ----

export function groupPendenciesByStatus(items: PendingItem[]): PendencyGroup {
	const group: PendencyGroup = { requested: [], responded: [], validated: [] };
	for (const item of items) {
		group[item.status]?.push(item);
	}
	return group;
}

export function canValidate(item: PendingItem): boolean {
	return item.status === 'responded';
}

export function canReopen(item: PendingItem): boolean {
	return item.status === 'responded';
}

function validateCreatePayload(payload: CreatePendencyPayload): string | null {
	if (payload.items.length === 0) {
		return 'Selecione ao menos um campo para solicitar a alteração.';
	}
	if (payload.items.some((item) => !item.comment.trim())) {
		return 'Informe o motivo da alteração para todos os campos marcados.';
	}
	return null;
}

function validateReviewPayload(payload: ReviewPendingItemsBody): string | null {
	if (payload.items.length === 0) {
		return 'Decida ao menos um campo para concluir a revisão.';
	}
	if (payload.items.some((item) => item.decision === 'reopen' && !item.comment.trim())) {
		return 'Informe o motivo para os itens reabertos.';
	}
	return null;
}
