import { apiClient, requesterIdentityHeaders } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import { ApiError } from '$lib/types/result';

import type {
	CreatePendingItemsBody,
	CreatePendingItemsResponse,
	ListPendenciesResponse,
	PendingItem,
	RespondPendingItemBody,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';
import type { InternalAttachment } from '$lib/types/request';
import type { RequesterIdentity } from '$lib/types/requester-tracking';

// Contrato de pendências (contract-pendencias v0.5).
function pendingItemsPath(protocol: string): string {
	const encoded = encodeURIComponent(protocol);
	return `/requests/${encoded}/pending-items`;
}

// Listagem — GET /requests/:protocol/pending-items (contrato v0.5 §7):
// retorna o envelope `ListPendingItemsResponse` (lote vigente: `batchId` +
// `requestAttachment` + `items`), sem paginação (lista curta, ordem cronológica;
// o front agrupa por `batchId`). O backend já filtra a visibilidade.
// `fetchImpl` é o fetch do `load` quando chamado no servidor.
export async function getPendingItems(
	protocol: string,
	identity?: RequesterIdentity | null,
	fetchImpl?: typeof fetch
): Promise<ListPendenciesResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		// Fluxo público: o mock reproduz a exigência de validação prévia
		// (401 sem identidade válida); o autenticado lê direto do store.
		if (identity) {
			const { listPendingItemsPublicMock } = await import('$lib/mocks/requester-tracking.mock');
			return listPendingItemsPublicMock(protocol);
		}
		const { listPendingItemsMock } = await import('$lib/mocks/pendency.mock');
		return listPendingItemsMock(protocol);
	}

	return apiClient<ListPendenciesResponse>(
		pendingItemsPath(protocol),
		{ headers: requesterIdentityHeaders(identity) },
		fetchImpl
	);
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

// Resposta do SOLICITANTE por item —
// PATCH /requests/:protocol/pending-items/:pendingItemId (contrato v0.5 §8).
// Um item por request (sem resposta em lote): `field_edit` envia
// `{ correctedValue }` (tipo preservado); `observation` envia `{ response }`
// (trim, 1..2000). A resposta NÃO traz `solicitationStatus` — o status é
// observado via detalhe/tracking.
export async function respondPendingItem(
	protocol: string,
	pendingItemId: string,
	body: RespondPendingItemBody,
	identity?: RequesterIdentity | null,
	fetchImpl?: typeof fetch
): Promise<PendingItem> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		if (identity) {
			const { respondPendingItemPublicMock } = await import('$lib/mocks/requester-tracking.mock');
			return respondPendingItemPublicMock(protocol, pendingItemId, body);
		}
		const { respondPendingItemMock } = await import('$lib/mocks/pendency.mock');
		return respondPendingItemMock(protocol, pendingItemId, body);
	}

	return apiClient<PendingItem>(
		`${pendingItemsPath(protocol)}/${encodeURIComponent(pendingItemId)}`,
		{
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: requesterIdentityHeaders(identity)
		},
		fetchImpl
	);
}

// Anexo do solicitante — POST
// /requests/:protocol/pending-items/:pendingItemId/attachments (contrato v0.5
// §9): `multipart/form-data`, campo `file`. Separado do PATCH de resposta.
// O upload pode acontecer em qualquer item do lote (`requestAttachment` é do
// lote, não do item).
export async function uploadPendingItemAttachment(
	protocol: string,
	pendingItemId: string,
	file: File,
	identity?: RequesterIdentity | null,
	fetchImpl?: typeof fetch
): Promise<InternalAttachment> {
	if (!file) {
		throw new ApiError(400, 'Selecione um arquivo para enviar.');
	}

	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.pendingItems) {
		const fileMeta = {
			fileName: file.name,
			mimeType: file.type,
			sizeBytes: file.size
		};
		if (identity) {
			const { uploadPendingItemAttachmentPublicMock } =
				await import('$lib/mocks/requester-tracking.mock');
			return uploadPendingItemAttachmentPublicMock(protocol, pendingItemId, fileMeta);
		}
		const { uploadPendingItemAttachmentMock } = await import('$lib/mocks/pendency.mock');
		return uploadPendingItemAttachmentMock(protocol, pendingItemId, fileMeta);
	}

	const formData = new FormData();
	formData.append('file', file);

	return apiClient<InternalAttachment>(
		`${pendingItemsPath(protocol)}/${encodeURIComponent(pendingItemId)}/attachments`,
		{
			method: 'POST',
			body: formData,
			headers: requesterIdentityHeaders(identity)
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
