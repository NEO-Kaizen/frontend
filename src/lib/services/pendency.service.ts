import {
	createPendingItems as createPendingItemsApi,
	getPendingItems as getPendingItemsApi,
	reopenPendingItem as reopenPendingItemApi,
	validatePendingItem as validatePendingItemApi
} from '$lib/api/pending-item.api';

import type {
	CreatePendencyPayload,
	CreatePendencyResponse,
	ListPendenciesQuery,
	ListPendenciesResponse,
	PendencyGroup,
	PendingItem,
	ReopenPendencyPayload,
	ValidatePendencyPayload
} from '$lib/types/pendency';
import { ApiError, type Result } from '$lib/types/result';

export async function listPendencies(
	protocol: string,
	query: ListPendenciesQuery = {},
	fetchImpl?: typeof fetch
): Promise<Result<ListPendenciesResponse>> {
	try {
		const data = await getPendingItemsApi(protocol, query, fetchImpl);
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

// Envia a solicitação de alteração por campo e muda o status para
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
				error.status === 404
					? 'Solicitação não encontrada.'
					: 'Não foi possível solicitar a alteração.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// "Validar alteração": aplica o valor corrigido e fecha o ciclo (respondida → validada).
export async function validatePendency(
	protocol: string,
	id: string,
	payload: ValidatePendencyPayload = {},
	fetchImpl?: typeof fetch
): Promise<Result<PendingItem>> {
	try {
		const data = await validatePendingItemApi(protocol, id, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: 'Não foi possível validar a alteração.'
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// "Solicitar novamente": reabre o ciclo com novo comentário (respondida → solicitada).
export async function requestAgain(
	protocol: string,
	id: string,
	payload: ReopenPendencyPayload,
	fetchImpl?: typeof fetch
): Promise<Result<PendingItem>> {
	if (!payload.comment.trim()) {
		return { ok: false, error: { message: 'Informe o motivo para solicitar novamente.' } };
	}

	try {
		const data = await reopenPendingItemApi(protocol, id, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: 'Não foi possível reabrir a pendência.'
				}
			};
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
