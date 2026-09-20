import type { InternalAttachment, PaginatedResponse, RequestStatus } from './request';

// Ciclo de uma pendência por campo: solicitada → respondida → validada.
// Valores em inglês espelham o contrato BACKEND-CONTRATO-PENDENCIAS-POR-CAMPO-0_2.md.
export type PendencyStatus = 'requested' | 'responded' | 'validated';

export const PENDENCY_STATUS_LABELS: Record<PendencyStatus, string> = {
	requested: 'Solicitada',
	responded: 'Respondida',
	validated: 'Validada'
};

export const PENDENCY_STATUS_ORDER: PendencyStatus[] = ['requested', 'responded', 'validated'];

// Valor escalar de um campo (tipos de api-requests.md).
export type PendingFieldValue = string | number | boolean | null;

// Referência a um campo da solicitação. `fieldLabel` e `currentValue` são
// derivados no servidor a partir do catálogo; o front envia apenas `fieldKey`.
// `currentValue` é o snapshot exibido ao analista (o "valor antigo" do diff).
export interface PendingFieldRef {
	fieldKey: string;
	fieldLabel: string;
	currentValue: PendingFieldValue;
}

// Pendência de um campo/observação. Cada criação gera UM OU MAIS itens; os
// itens criados juntos compartilham o mesmo `batchId` (o pedido de anexo é
// do LOTE, não do item). Contrato v0.4 — POST /requests/:protocol/pending-items.
export type PendingItemType = 'field_edit' | 'observation';

export interface PendingItem {
	id: string;
	protocol: string;
	batchId: string;
	type: PendingItemType;
	field: PendingFieldRef | null;
	comment: string;
	status: PendencyStatus;
	correctedValue: PendingFieldValue;
	responseText: string | null;
	responseAttachments: InternalAttachment[];
	deadline?: string | null;
	createdAt: string;
	respondedAt: string | null;
	validatedAt: string | null;
}

// Body de POST /requests/:protocol/pending-items (contrato v0.4). Lote único:
// `observation` geral (trim não vazio) e/ou `items` com ao menos um campo.
// `requestAttachment` é do lote inteiro — nunca dentro de `items`.
export interface CreatePendingItemField {
	fieldKey: string;
	comment: string;
}

export interface CreatePendingItemsBody {
	observation?: string;
	requestAttachment?: boolean;
	items?: CreatePendingItemField[];
}

// Aliases do contrato anterior — mantidos para não quebrar imports existentes.
export type CreatePendingItemEntry = CreatePendingItemField;
export type CreatePendencyPayload = CreatePendingItemsBody;

// Resposta de POST .../pending-items (contrato v0.4).
export interface CreatePendingItemsResponse {
	batchId: string;
	requestAttachment: boolean;
	items: PendingItem[];
}

// Alias do contrato anterior.
export type CreatePendencyResponse = CreatePendingItemsResponse;

// Decisão do analista por item na revisão em lote (§3).
export type ReviewPendingItemDecision =
	| { id: string; decision: 'validate'; note?: string }
	| { id: string; decision: 'reopen'; comment: string };

// Body de POST .../pending-items/review (§3).
export interface ReviewPendingItemsBody {
	batchId: string;
	requestAttachment?: boolean;
	items: ReviewPendingItemDecision[];
}

// Resposta de POST .../pending-items/review (§3).
export interface ReviewPendingItemsResponse {
	batchId: string;
	items: PendingItem[];
	solicitationStatus: RequestStatus;
}

// Corpo/resposta públicos de POST .../pending-items/respond (§2). Fluxo do
// solicitante (identidade protocolo + e-mail) — tipos apenas por ora.
export interface RespondPendingItemEntry {
	id: string;
	correctedValue: PendingFieldValue;
	responseComment?: string;
}

export interface RespondPendingItemsBody {
	batchId: string;
	email: string;
	responseComment?: string;
	items: RespondPendingItemEntry[];
}

export interface RespondPendingItemsResponse {
	batchId: string;
	items: PendingItem[];
	solicitationStatus: RequestStatus;
}

// Listagem apenas em mock (DEV): o contrato §4 não define GET dedicado — a
// leitura real vem do canal/detalhe interno (#125) e do `correctionAlert`.
export interface ListPendenciesQuery {
	status?: PendencyStatus;
	page?: number;
	pageSize?: number;
}

export type ListPendenciesResponse = PaginatedResponse<PendingItem>;

// Agrupamento por status — base do filtro da reunião (solicitadas/respondidas).
export type PendencyGroup = Record<PendencyStatus, PendingItem[]>;
