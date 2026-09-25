import type { MappingResponse } from './mapping';
import type { TriageAssessment } from './triage';
import type { UserType } from './user';

// Perfil interno (autor/ator da timeline): qualquer role exceto Solicitante.
export type InternalRole = Exclude<UserType, 'Solicitante'>;

export interface TimelineActor {
	id: string;
	name: string;
	role: InternalRole;
}

// Lista fechada de ações da timeline (D-N4/D-N12) — subconjunto de
// `auditCatalog`; ações fora dela nunca aparecem na leitura.
export type TimelineEventAction =
	| 'request.assign'
	| 'request.reassign'
	| 'request.unassign'
	| 'request.status_change'
	| 'mapping.assign';

// `audit_history.change_origin` — `null` em linhas legadas.
export type TimelineChangeOrigin = 'admin' | 'system' | 'internal' | null;

export interface TimelineNote {
	type: 'note';
	// internal_note_id (numérico) — usado no PUT /read.
	id: string;
	content: string;
	createdAt: string;
	author: TimelineActor;
}

export interface TimelineEvent {
	type: 'event';
	// id namespaced: `<audit_id>` com prefixo "audit:".
	id: string;
	action: TimelineEventAction;
	// Frase completa já renderizada no backend (pt-BR) — o FE nunca parseia
	// valores brutos de auditoria (D-N3).
	text: string;
	occurredAt: string;
	// `null` = ação de sistema ou usuário removido.
	actor: TimelineActor | null;
	changeOrigin: TimelineChangeOrigin;
	// `justification` e `lastTechnicalMessage` são exclusivos de
	// `request.status_change`: `justification` é a justificativa interna
	// (opcional); `lastTechnicalMessage` é `string` 1..4000 no retorno público e
	// `null` quando o destino é interno. Ambos ausentes nas demais ações.
	justification?: string | null;
	lastTechnicalMessage?: string | null;
}

export type TimelineItem = TimelineNote | TimelineEvent;

// Entrada do histórico de triagens (D-N14): snapshot completo daquela versão
// + data da linha `request.triage` que a gerou (sem ator/origem — removidos
// da API junto com as colunas da tabela).
export interface TriageHistoryEntry {
	triage: Omit<TriageAssessment, 'lastTechnicalMessage'> & {
		lastTechnicalMessage?: string | null;
	};
	occurredAt: string;
}

// Entrada do histórico de mapeamentos (D-N14): snapshot completo (DTO do
// GET/PUT de mapeamento) + data da última linha `mapping.*`.
export interface MappingHistoryEntry {
	mapping: MappingResponse & {
		targetStatus?: number | null;
		justification?: string | null;
		lastTechnicalMessage?: string | null;
	};
	occurredAt: string;
}

// Envelope do GET — página em ordem mais-recente-primeiro (D-N7/D-N8);
// `triages`/`mappings` são históricos completos (`oldest → newest`),
// não paginados, idênticos em todas as páginas (D-N9/D-N14).
export interface InternalNotesResponse {
	items: TimelineItem[];
	nextCursor: string | null;
	unseenCount: number;
	triages: TriageHistoryEntry[];
	mappings: MappingHistoryEntry[];
}

export interface GetInternalNotesParams {
	limit?: number;
	cursor?: string;
}

export interface CreateInternalNotePayload {
	content: string;
}

export interface MarkInternalNotesReadPayload {
	lastReadNoteId: string;
}

export const INTERNAL_NOTE_MAX_LENGTH = 4000;
export const INTERNAL_NOTE_PAGE_DEFAULT = 20;
export const INTERNAL_NOTE_PAGE_MIN = 1;
export const INTERNAL_NOTE_PAGE_MAX = 50;
