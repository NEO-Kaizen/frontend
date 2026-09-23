import {
	createPendingItems as createPendingItemsApi,
	getPendingItems as getPendingItemsApi,
	respondPendingItem as respondPendingItemApi,
	reviewPendingItems as reviewPendingItemsApi,
	uploadPendingItemAttachment as uploadPendingItemAttachmentApi
} from '$lib/api/pending-item.api';

import type {
	CreatePendingItemsBody,
	CreatePendingItemsResponse,
	CreatePendingItemField,
	ListPendenciesResponse,
	ListPendingItemsResponse,
	PendingBatch,
	PendingItem,
	RespondPendingItemBody,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';
import type { InternalAttachment } from '$lib/types/request';
import type { RequesterIdentity } from '$lib/types/requester-tracking';
import { ApiError, type Result } from '$lib/types/result';
import {
	MAX_ATTACHMENTS,
	validatePendingAttachmentBatch,
	validatePendingAttachmentFile
} from '$lib/pendency/pending-attachments';

export async function listPendencies(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<ListPendenciesResponse>> {
	try {
		const data = await getPendingItemsApi(protocol, undefined, fetchImpl);
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

// ---- Regras do lote (uma pendência = um `batchId`) ----

// Agrupa os itens em blocos de pendência (§5). Aceita o envelope do GET
// (`ListPendingItemsResponse`) ou o array de itens — a flag `requestAttachment`
// do lote vigente vem do envelope e é a ÚNICA fonte de verdade para o upload
// (nunca `?? true`: lote sem flag conhecida não exibe upload).
// Ordenação cronológica: lote mais antigo primeiro; dentro do lote, a
// observação geral primeiro e depois os campos por criação.
export function toPendingBatches(
	input: PendingItem[] | ListPendingItemsResponse | null | undefined,
	flagsByBatch?: ReadonlyMap<string, boolean> | Record<string, boolean>
): PendingBatch[] {
	const items: PendingItem[] = Array.isArray(input)
		? input
		: (input?.items ?? []);
	const envelope: ListPendingItemsResponse | null =
		input && !Array.isArray(input) ? input : null;

	const flagOf = (batchId: string): boolean => {
		if (flagsByBatch instanceof Map) return flagsByBatch.get(batchId) ?? false;
		if (flagsByBatch) {
			return (flagsByBatch as Record<string, boolean | undefined>)[batchId] ?? false;
		}
		if (envelope && envelope.batchId === batchId) return envelope.requestAttachment === true;
		return false;
	};

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
			requestAttachment: flagOf(batchId),
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

// Bloqueio de nova pendência (§4): retorna o lote em aberto mais antigo, ou
// `null` quando o analista pode criar uma nova pendência.
export function findOpenBatch(batches: PendingBatch[]): PendingBatch | null {
	return batches.find((batch) => !batch.resolved) ?? null;
}

/** Teto da observação na criação (contrato v0.5, decisão D-P16). */
export const MAX_OBSERVATION_LENGTH = 2000;

/** Teto da resposta do solicitante a uma observação (contrato v0.5 §8). */
export const MAX_OBSERVATION_RESPONSE_LENGTH = 2000;

// ---- Resposta do SOLICITANTE por item (contrato v0.5 §8) ----

// Um item por request — PATCH /requests/:protocol/pending-items/:pendingItemId.
// `field_edit` → `{ correctedValue }` (tipo preservado); `observation` →
// `{ response }` (trim, 1..2000). Sem botão global, sem lote, sem
// `solicitationStatus` na resposta (o status é observado via tracking).
export async function respondPendingItemAsRequester(
	protocol: string,
	item: PendingItem,
	body: RespondPendingItemBody,
	identity?: RequesterIdentity | null,
	fetchImpl?: typeof fetch
): Promise<Result<PendingItem>> {
	const validation = validateRespondBody(item, body);
	if (validation) {
		return { ok: false, error: { message: validation } };
	}

	try {
		const data = await respondPendingItemApi(protocol, item.id, body, identity, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 400
					? 'Resposta inválida. Confira o valor informado.'
					: error.status === 401
						? 'Autorização expirada. Valide seus dados novamente.'
						: error.status === 403
							? 'Você não tem permissão para responder esta pendência.'
							: error.status === 404
								? 'Pendência não encontrada.'
								: error.status === 409
									? 'Esta pendência já foi respondida.'
									: 'Não foi possível enviar a resposta.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// Anexo do solicitante — POST
// .../pending-items/:pendingItemId/attachments (`multipart/form-data`, campo
// `file`; PDF/DOCX/XLSX/PNG/JPG, 10 MB; resposta `201 InternalAttachment`).
// Separado do PATCH; o upload pode acontecer em qualquer item do lote
// (`requestAttachment` é do lote). A validação de arquivo roda antes do envio.
export async function uploadPendingItemAttachmentAsRequester(
	protocol: string,
	pendingItemId: string,
	file: File,
	identity?: RequesterIdentity | null,
	fetchImpl?: typeof fetch
): Promise<Result<InternalAttachment>> {
	const validation = validateAttachmentFile(file);
	if (validation) {
		return { ok: false, error: { message: validation } };
	}

	try {
		const data = await uploadPendingItemAttachmentApi(
			protocol,
			pendingItemId,
			file,
			identity,
			fetchImpl
		);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 400
					? 'Arquivo inválido. Use PDF, DOCX, XLSX, PNG ou JPG de até 10 MB.'
					: error.status === 401
						? 'Autorização expirada. Valide seus dados novamente.'
						: error.status === 403
							? 'Você não tem permissão para anexar arquivos nesta pendência.'
							: error.status === 404
								? 'Pendência não encontrada.'
								: error.status === 409
									? 'Esta pendência já foi respondida.'
									: 'Não foi possível enviar o anexo.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// Validação de UM arquivo antes do upload (tipo → tamanho). Para as regras
// do lote (máximo de 3, duplicados), usar `validatePendingAttachmentSelection`
// com os anexos já enviados/selecionados.
export function validateAttachmentFile(file: File): string | null {
	return validatePendingAttachmentFile(file);
}

export interface PendingAttachmentSelection {
	valid: File[];
	rejected: { file: File; message: string }[];
}

/**
 * Valida uma seleção de arquivos contra o estado do lote: máximo de
 * `MAX_ATTACHMENTS` (enviados + seleção atual), 10 MB por arquivo,
 * PDF/DOCX/XLSX/PNG/JPG e sem duplicados (`name + size + type`). Não envia
 * nada — só classifica em `valid`/`rejected` para a UI exibir por arquivo.
 */
export function validatePendingAttachmentSelection(
	files: readonly File[],
	options: {
		sentAttachments?: readonly InternalAttachment[];
		alreadySelected?: readonly File[];
	} = {}
): PendingAttachmentSelection {
	return validatePendingAttachmentBatch(files, {
		sentAttachments: (options.sentAttachments ?? []).map((attachment) => ({
			fileName: attachment.fileName,
			sizeBytes: attachment.sizeBytes,
			mimeType: attachment.mimeType
		})),
		alreadySelected: options.alreadySelected
	});
}

export { MAX_ATTACHMENTS };

function validateRespondBody(item: PendingItem, body: RespondPendingItemBody): string | null {
	if (item.status !== 'requested') {
		return 'Esta pendência já foi respondida.';
	}
	if (item.type === 'observation') {
		if (!('response' in body)) return 'Informe a resposta da observação.';
		const trimmed = body.response.trim();
		if (!trimmed) return 'Descreva a resposta antes de enviar.';
		if (trimmed.length > MAX_OBSERVATION_RESPONSE_LENGTH) {
			return `A resposta deve ter no máximo ${MAX_OBSERVATION_RESPONSE_LENGTH} caracteres.`;
		}
		return null;
	}
	if (!('correctedValue' in body)) return 'Informe o valor corrigido.';
	if (body.correctedValue === null) return 'Informe o valor corrigido.';
	if (typeof body.correctedValue === 'string' && !body.correctedValue.trim()) {
		return 'Informe o valor corrigido.';
	}
	return null;
}

// ---- Derivações de exibição do solicitante (contrato v0.5) ----

// `overdue` NÃO é status persistido: é apresentação derivada de
// `requested + deadline vencido`. Compara só a data (`yyyy-mm-dd`).
export function isPendingItemOverdue(item: PendingItem, now: Date = new Date()): boolean {
	if (item.status !== 'requested' || !item.deadline) return false;
	const day = item.deadline.slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
	const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	return day < today;
}

// Unread do solicitante: `requested` conta; `responded`/`validated`, não.
// Sem endpoint de "marcar como lido", sem armazenamento local.
export function countUnreadRequesterItems(items: PendingItem[]): number {
	return items.filter((item) => item.status === 'requested').length;
}

// Exigência de anexo do LOTE: `requestAttachment` é flag do `batchId` vinda
// do GET (`ListPendingItemsResponse`) — nunca de campo individual e nunca com
// fallback para `true`. Somente `=== true` exibe o upload no solicitante.
export function doesBatchRequireAttachment(batch: PendingBatch): boolean {
	return batch.requestAttachment === true;
}

// Lote completo para o solicitante: todos os itens `responded`/`validated` +
// (quando o lote exige anexo) ao menos 1 anexo no lote.
export function isBatchCompleteForRequester(batch: PendingBatch): boolean {
	const allAnswered = batch.items.every(
		(item) => item.status === 'responded' || item.status === 'validated'
	);
	if (!allAnswered) return false;
	if (!doesBatchRequireAttachment(batch)) return true;
	return batch.items.some((item) => item.responseAttachments.length > 0);
}

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
