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

// Pendência de um campo. Cada criação gera UM item; os itens criados juntos
// compartilham o mesmo `batchId` (o pedido de anexo é do LOTE, não do item).
// O item é mutável: a revisão valida ou sobrescreve (reopen) — o registro
// imutável de cada pedido/resposta/decisão fica no log de auditoria (backend).
export interface PendingItem {
	id: string;
	protocol: string;
	batchId: string;
	field: PendingFieldRef;
	comment: string;
	status: PendencyStatus;
	responseComment: string | null;
	correctedValue: PendingFieldValue;
	responseAttachments: InternalAttachment[];
	createdAt: string;
	respondedAt: string | null;
	validatedAt: string | null;
}

// Body de POST /requests/:protocol/pending-items (§1 do contrato). O front
// envia apenas `fieldKey` + `comment`; `requestAttachment` vale para o lote.
export interface CreatePendingItemEntry {
	fieldKey: string;
	comment: string;
}

export interface CreatePendencyPayload {
	requestAttachment?: boolean;
	items: CreatePendingItemEntry[];
}

// Resposta de POST .../pending-items (§1).
export interface CreatePendencyResponse {
	batchId: string;
	requestAttachment: boolean;
	items: PendingItem[];
	solicitationStatus: RequestStatus;
}

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
