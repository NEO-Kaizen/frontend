import {
	createPendingItems as createPendingItemsApi,
	getPendingItems as getPendingItemsApi,
	reviewPendingItems as reviewPendingItemsApi
} from '$lib/api/pending-item.api';

import type {
	CreatePendingItemsBody,
	CreatePendingItemsResponse,
	CreatePendingItemField,
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

// §1 — envia a solicitação de pendência em lote único (observação e/ou
// campos + pedido opcional de anexo) e muda o status para
// "Pendente de informações". Validação espelhada no mock/backend.
export async function requestFieldChange(
	protocol: string,
	payload: CreatePendingItemsBody,
	fetchImpl?: typeof fetch
): Promise<Result<CreatePendingItemsResponse>> {
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

// Draft do lote no frontend — espelha o que o modal de solicitação edita.
// Reaproveitado por SolicitationSpecs: `items` vem do pendingDraft (campo +
// comentário), `observation`/`requestAttachment` vêm do modal do lote.
export interface PendingBatchDraft {
	observation?: string;
	requestAttachment?: boolean;
	items?: CreatePendingItemField[];
}

// Monta o payload final do POST em uma única chamada (um lote). Normaliza:
// - `observation` com trim; vazia é omitida;
// - `items` com comentários em trim; itens sem comentário são descartados aqui
//   (a validação barra o envio — nunca enviamos `comment: ""`);
// - `requestAttachment: true` só quando marcado; caso contrário omitido.
export function buildCreatePendingItemsPayload(draft: PendingBatchDraft): CreatePendingItemsBody {
	const payload: CreatePendingItemsBody = {};

	const observation = draft.observation?.trim() ?? '';
	if (observation) {
		payload.observation = observation;
	}

	const items = (draft.items ?? [])
		.map((item) => ({ fieldKey: item.fieldKey, comment: item.comment.trim() }))
		.filter((item) => item.fieldKey.trim() !== '' && item.comment !== '');

	if (items.length > 0) {
		payload.items = items;
	}

	if (draft.requestAttachment) {
		payload.requestAttachment = true;
	}

	return payload;
}

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

function validateCreatePayload(payload: CreatePendingItemsBody): string | null {
	const hasObservation = (payload.observation?.trim() ?? '') !== '';
	const items = payload.items ?? [];
	if (!hasObservation && items.length === 0) {
		return 'Informe uma observação ou selecione ao menos um campo para solicitar a pendência.';
	}
	if (items.some((item) => !item.fieldKey.trim() || !item.comment.trim())) {
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
