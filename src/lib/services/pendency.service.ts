import {
	createPendingItems as createPendingItemsApi,
	getPendingItems as getPendingItemsApi,
	reviewPendingItems as reviewPendingItemsApi
} from '$lib/api/pending-item.api';

import type {
	CreatePendingItemsBody,
	CreatePendingItemsResponse,
	CreatePendingItemField,
	ListPendenciesResponse,
	PendencyGroup,
	PendingBatch,
	PendingItem,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';
import { ApiError, type Result } from '$lib/types/result';

export async function listPendencies(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<ListPendenciesResponse>> {
	try {
		const data = await getPendingItemsApi(protocol, fetchImpl);
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

// Criação — POST /requests/:protocol/pending-items (contrato v0.5 §6). Lote
// único (observação e/ou campos + anexo do lote). Validação espelhada no
// mock/backend. O backend retorna 409 (D-P22) enquanto existir item
// `requested`/`responded` para o protocolo — o frontend também bloqueia na UI.
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
						? 'Já existe uma pendência em aberto para esta solicitação.'
						: error.status === 404
							? 'Solicitação não encontrada.'
							: 'Não foi possível solicitar a alteração.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// Revisão parcial — PATCH /requests/:protocol/pending-items/review
// (contrato v0.5 §9, regra D-P23). Envia somente os itens decididos (validar
// fecha; reabrir volta para `requested`); os não enviados continuam
// `responded` para revisão posterior — sem estado novo de "revisar depois".
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

// ---- Regras do lote (uma pendência = um `batchId`) ----

// Agrupa os itens em blocos de pendência para a visão do analista (§5).
// Ordenação cronológica: lote mais antigo primeiro; dentro do lote, a
// observação geral primeiro e depois os campos por criação.
export function toPendingBatches(items: PendingItem[]): PendingBatch[] {
	const byBatch = new Map<string, PendingItem[]>();
	for (const item of items) {
		const group = byBatch.get(item.batchId);
		if (group) group.push(item);
		else byBatch.set(item.batchId, [item]);
	}

	const batches: PendingBatch[] = [];
	for (const [batchId, unsorted] of byBatch) {
		const sorted = [...unsorted].sort(
			(a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
		);
		const observation = sorted.find((item) => item.type === 'observation') ?? null;
		const fields = sorted.filter((item) => item.type === 'field_edit');
		const requestedCount = sorted.filter((item) => item.status === 'requested').length;
		const respondedCount = sorted.filter((item) => item.status === 'responded').length;
		const validatedCount = sorted.filter((item) => item.status === 'validated').length;
		batches.push({
			batchId,
			protocol: sorted[0]?.protocol ?? '',
			items: sorted,
			observation,
			fields,
			fieldCount: fields.length,
			requestedCount,
			respondedCount,
			validatedCount,
			resolved: sorted.length > 0 && validatedCount === sorted.length,
			createdAt: sorted[0]?.createdAt ?? ''
		});
	}

	return batches.sort(
		(a, b) => a.createdAt.localeCompare(b.createdAt) || a.batchId.localeCompare(b.batchId)
	);
}

// Uma pendência só está resolvida quando TODOS os itens têm decisão — §9.
// Enquanto existir item `requested` (aguardando solicitante) ou `responded`
// (aguardando revisão, inclusive "revisar depois"), a pendência está aberta.
export function isBatchResolved(batch: PendingBatch): boolean {
	return batch.resolved;
}

// Bloqueio de nova pendência (§4): retorna o lote em aberto mais antigo, ou
// `null` quando o analista pode criar uma nova pendência.
export function findOpenBatch(batches: PendingBatch[]): PendingBatch | null {
	return batches.find((batch) => !batch.resolved) ?? null;
}

/** Teto da observação na criação (contrato v0.5, decisão D-P16). */
export const MAX_OBSERVATION_LENGTH = 2000;

function validateCreatePayload(payload: CreatePendingItemsBody): string | null {
	const observation = payload.observation?.trim() ?? '';
	const items = payload.items ?? [];
	if (!observation && items.length === 0) {
		return 'Informe uma observação ou selecione ao menos um campo para solicitar a pendência.';
	}
	if (observation.length > MAX_OBSERVATION_LENGTH) {
		return `A observação deve ter no máximo ${MAX_OBSERVATION_LENGTH} caracteres.`;
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
