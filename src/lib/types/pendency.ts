import type { InternalAttachment } from './request';

// Ciclo de uma pendência: solicitada → respondida → validada.
// Valores em inglês espelham o contrato de pendências (contract-pendencias v0.5).
// `overdue` NÃO é status persistido: é view derivada de `requested` + `deadline` vencido.
export type PendencyStatus = 'requested' | 'responded' | 'validated';

export const PENDENCY_STATUS_LABELS: Record<PendencyStatus, string> = {
	requested: 'Solicitada',
	responded: 'Respondida',
	validated: 'Validada'
};

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
// do LOTE, não do item). Contrato v0.5 — POST /requests/:protocol/pending-items.
// A observação é um item próprio (`type: 'observation'`, `field: null`) —
// nunca mensagem de chat.
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

// Body de POST /requests/:protocol/pending-items (contrato v0.5). Lote único:
// `observation` (trim não vazio) e/ou `items` com ao menos um campo — pelo
// menos um dos dois deve existir. `requestAttachment` é do lote inteiro,
// nunca dentro de `items`.
export interface CreatePendingItemField {
	fieldKey: string;
	comment: string;
}

export interface CreatePendingItemsBody {
	observation?: string;
	requestAttachment?: boolean;
	items?: CreatePendingItemField[];
}

// Resposta de POST .../pending-items (contrato v0.5).
export interface CreatePendingItemsResponse {
	batchId: string;
	requestAttachment: boolean;
	items: PendingItem[];
}

// Decisão do analista por item na revisão parcial do lote (contrato v0.5 §9,
// regra D-P23): somente os itens enviados são decididos; os demais continuam
// `responded` para revisão posterior. Não existe estado de "revisar depois".
export type ReviewPendingItemDecision =
	| { id: string; decision: 'validate'; note?: string }
	| { id: string; decision: 'reopen'; comment: string };

// Body de PATCH .../pending-items/review (contrato v0.5 §9).
export interface ReviewPendingItemsBody {
	batchId: string;
	requestAttachment?: boolean;
	items: ReviewPendingItemDecision[];
}

// Resposta de PATCH .../pending-items/review (contrato v0.5 §9, decisão D-P18:
// sem `solicitationStatus` — o backend aplica a transição e o frontend observa
// via `GET /internal` / `tracking`. `items` traz os decididos nesta chamada.
export interface ReviewPendingItemsResponse {
	batchId: string;
	items: PendingItem[];
}

// Resposta do solicitante por item —
// PATCH /requests/:protocol/pending-items/:pendingItemId (contrato v0.5 §8).
// Fluxo do solicitante (outra branch): a observação responde com `response`
// (vai para `responseText`); o campo responde com `correctedValue`. A distinção
// já é respeitada na exibição do analista. Tipos apenas, sem chamada API.
export type RespondPendingItemBody = { response: string } | { correctedValue: PendingFieldValue };

export interface ListPendingItemsResponse {
	batchId: string | null;
	requestAttachment: boolean;
	items: PendingItem[];
}

/** Alias legado — preferir `ListPendingItemsResponse` (contrato oficial). */
export type ListPendenciesResponse = ListPendingItemsResponse;

// Leitura estendida do GET /requests/:protocol/internal (contrato v0.5 §7,
// decisões D-P2/D-P21): `unread` é puramente derivado de `status` (internos
// contam `responded`), sem armazenamento e sem endpoint de "marcar como lido".
export interface UnreadState {
	count: number;
	hasUnread: boolean;
	lastUnreadAt: string | null;
}

export interface CorrectionAlert {
	count: number;
	batchId: string;
}

export interface PendingSummary {
	total: number;
	requested: number;
	responded: number;
	validated: number;
}

// Bloco visual de UMA pendência: todos os itens criados juntos (mesmo
// `batchId`), conforme §5 — "1 pendência → N campos", nunca "N pendências".
// A observação geral é o item `type: 'observation'` (`field: null`); os
// campos são os itens `type: 'field_edit'`.
export interface PendingBatch {
	batchId: string;
	protocol: string;
	requestAttachment: boolean;
	/** Todos os itens do lote, em ordem cronológica de criação. */
	items: PendingItem[];
	/** Instrução/observação geral do lote, quando enviada. */
	observation: PendingItem | null;
	/** Campos solicitados no lote (`type: 'field_edit'`). */
	fields: PendingItem[];
	fieldCount: number;
	requestedCount: number;
	respondedCount: number;
	validatedCount: number;
	/** `true` somente quando TODOS os itens têm decisão (`validated`) — §9. */
	resolved: boolean;
	/** Criação do lote (menor `createdAt` dos itens). */
	createdAt: string;
}
