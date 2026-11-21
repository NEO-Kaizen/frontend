// Contrato de comunicação Frontend ↔ Backend do Histórico de Auditoria
// (backend/docs/audit-history-contract.md): GET /audit-history (listagem
// paginada) e GET /audit-history/:id (detalhe). Os campos espelham a API
// fielmente (snake_case); rótulos de exibição ficam em `lib/audit`.

// Entidades auditáveis — chaves do auditCatalog do backend.
export type AuditEntityType =
	'user' | 'prioritization' | 'request' | 'mapping' | 'settings' | 'pending_item';

// Ator do evento. `kind: "system"` equivale a ação sem ator humano e a UI
// renderiza como "Sistema"; `displayName` já vem resolvido pelo backend.
export interface AuditActor {
	kind: 'system' | 'user';
	userId: number | null;
	displayName: string | null;
}

export interface AuditHistoryQuery {
	page?: number;
	limit?: number;
	entityType?: AuditEntityType;
}

// Item da tabela (colunas: ID, Tipo, Ação, Operador, Data).
export interface AuditHistorySummary {
	audit_id: number;
	entity_type: string;
	entity_type_label: string;
	action_type: string;
	actor: AuditActor;
	occurred_at: string;
}

// Envelope da listagem. O backend não envia totalPages: o total de páginas é
// derivado com Math.ceil(total / limit).
export interface AuditHistoryListResponse {
	items: AuditHistorySummary[];
	total: number;
	page: number;
	limit: number;
}

// Detalhe completo do evento — alimenta o modal aberto ao clicar no log.
export interface AuditHistoryDetail {
	audit_id: number;
	entity_type: string;
	entity_id: string;
	action_type: string;
	actor: AuditActor;
	previous_value: string | null;
	new_value: string | null;
	note: string | null;
	change_origin: string | null;
	occurred_at: string;
}
