import type { AuditEntityType } from '$lib/types/audit';

// Espelho de exibição do `auditCatalog` do backend
// (backend/src/shared/audit/auditCatalog.ts — branch feat/124-motor-status-v4).
// Toda entidade/ação nova no catálogo precisa entrar aqui para não cair no
// fallback de valor cru. O contrato de `/audit-history` só entrega o rótulo da
// ENTIDADE (`entity_type_label`); o rótulo da AÇÃO é responsabilidade da UI.

export interface AuditEntityOption {
	value: AuditEntityType;
	label: string;
}

// Usado no filtro da tela (o rótulo de cada linha continua vindo do backend).
export const AUDIT_ENTITY_OPTIONS: readonly AuditEntityOption[] = [
	{ value: 'user', label: 'Usuários' },
	{ value: 'prioritization', label: 'Priorização' },
	{ value: 'request', label: 'Solicitações' },
	{ value: 'mapping', label: 'Mapeamento' },
	{ value: 'settings', label: 'Configuração do portal' },
	{ value: 'pending_item', label: 'Pendências' }
];

export function isAuditEntityType(value: string): value is AuditEntityType {
	return AUDIT_ENTITY_OPTIONS.some((option) => option.value === value);
}

// Ações compostas (`<entidade>.<ação>`) → frase curta de exibição.
const ACTION_LABELS: Record<string, string> = {
	'user.create': 'Usuário criado',
	'user.activate': 'Usuário ativado',
	'user.deactivate': 'Usuário desativado',
	'user.reset_password': 'Senha redefinida',
	'user.change_password': 'Senha alterada',
	'user.update_profile': 'Perfil de usuário atualizado',
	'user.update': 'Usuário atualizado',
	'prioritization.evaluate': 'Priorização avaliada',
	'request.assign': 'Solicitação atribuída',
	'request.reassign': 'Responsável alterado',
	'request.unassign': 'Atribuição removida',
	'request.status_change': 'Status alterado',
	'request.update': 'Solicitação atualizada',
	'request.triage': 'Triagem registrada',
	// Motor de Status v4 (issue #124).
	'request.override_status_admin': 'Status definido por override (Administrador)',
	'request.access_denied': 'Acesso negado à mudança de status',
	'mapping.assign': 'Mapeamento atribuído',
	'mapping.save': 'Mapeamento salvo',
	'mapping.complete': 'Mapeamento concluído',
	'settings.update': 'Configuração do portal atualizada',
	'pending_item.create': 'Pendência criada',
	'pending_item.respond': 'Pendência respondida',
	'pending_item.attach': 'Anexo adicionado à pendência',
	'pending_item.validate': 'Pendência validada',
	'pending_item.reopen': 'Pendência reaberta'
};

// Ação fora do mapa exibe o valor cru — não quebra com vocabulário futuro.
export function getActionLabel(actionType: string): string {
	return ACTION_LABELS[actionType] ?? actionType;
}
