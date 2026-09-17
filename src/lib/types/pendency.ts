import type { InternalAttachment, PaginatedResponse } from './request';

// Ciclo de uma pendência por campo: solicitada → respondida → validada.
// Contrato proposto — valores em inglês espelham o endpoint do backend.
export type PendencyStatus = 'requested' | 'responded' | 'validated';

export const PENDENCY_STATUS_LABELS: Record<PendencyStatus, string> = {
	requested: 'Solicitada',
	responded: 'Respondida',
	validated: 'Validada'
};

export const PENDENCY_STATUS_ORDER: PendencyStatus[] = ['requested', 'responded', 'validated'];

// Referência a um campo da solicitação selecionado pelo analista. `currentValue`
// é o snapshot exibido no momento da solicitação (usado no diff antigo → novo).
export interface PendingFieldRef {
	fieldKey: string;
	fieldLabel: string;
	currentValue: string;
}

// Entidade central do fluxo: uma pendência por campo, com ciclo próprio.
export interface PendingItem {
	id: string;
	protocol: string;
	field: PendingFieldRef;
	comment: string;
	attachments: InternalAttachment[];
	status: PendencyStatus;
	responseComment: string | null;
	correctedValue: string | null;
	responseAttachments: InternalAttachment[];
	createdAt: string;
	respondedAt: string | null;
	validatedAt: string | null;
}

// Item do corpo JSON do POST /pending-items. O fluxo atual envia apenas
// justificativa por campo (sem anexos na criação).
export interface CreatePendencyItem {
	field: PendingFieldRef;
	comment: string;
}

export interface CreatePendencyPayload {
	items: CreatePendencyItem[];
}

export interface CreatePendencyResponse {
	items: PendingItem[];
	// Status da solicitação após o envio (mudança para "Pendente de informações").
	solicitationStatus?: string;
}

export interface ListPendenciesQuery {
	status?: PendencyStatus;
	page?: number;
	pageSize?: number;
}

export interface ReopenPendencyPayload {
	comment: string;
}

export interface ValidatePendencyPayload {
	note?: string;
}

// Agrupamento por status — base do filtro da reunião (solicitadas/respondidas).
export type PendencyGroup = Record<PendencyStatus, PendingItem[]>;

export type ListPendenciesResponse = PaginatedResponse<PendingItem>;
