import { ApiError } from '$lib/types/result';

import type {
	AuditActor,
	AuditHistoryDetail,
	AuditHistoryListResponse,
	AuditHistoryQuery,
	AuditHistorySummary
} from '$lib/types/audit';

// Dados fictícios do Histórico de Auditoria. Os registros já vêm em ordem
// cronológica decrescente, como o backend ordena (`occurred_at DESC`).

const ENTITY_LABELS: Record<string, string> = {
	user: 'Usuários',
	prioritization: 'Priorização',
	request: 'Solicitações',
	mapping: 'Mapeamento',
	settings: 'Configuração do portal',
	pending_item: 'Pendências'
};

function user(userId: number, displayName: string): AuditActor {
	return { kind: 'user', userId, displayName };
}

function system(): AuditActor {
	return { kind: 'system', userId: null, displayName: null };
}

const EVENTS: AuditHistoryDetail[] = [
	{
		audit_id: 24,
		entity_type: 'settings',
		entity_id: 'settings',
		action_type: 'settings.update',
		actor: user(102, 'Administrador Teste'),
		previous_value: '{"solicitationMode":"PUBLIC"}',
		new_value: '{"solicitationMode":"AUTHENTICATED"}',
		note: null,
		change_origin: null,
		occurred_at: '2026-09-21T04:15:49.041Z'
	},
	{
		audit_id: 23,
		entity_type: 'user',
		entity_id: '117',
		action_type: 'user.create',
		actor: user(102, 'Administrador Teste'),
		previous_value: null,
		new_value: '{"profile":"Analista"}',
		note: null,
		change_origin: null,
		occurred_at: '2026-09-21T04:15:46.164Z'
	},
	{
		audit_id: 22,
		entity_type: 'user',
		entity_id: '117',
		action_type: 'user.change_password',
		actor: user(117, 'Sol Clean B108'),
		previous_value: null,
		new_value: null,
		note: null,
		change_origin: null,
		occurred_at: '2026-09-21T04:07:14.180Z'
	},
	{
		audit_id: 21,
		entity_type: 'user',
		entity_id: '116',
		action_type: 'user.create',
		actor: user(102, 'Administrador Teste'),
		previous_value: null,
		new_value: '{"profile":"Gestor"}',
		note: null,
		change_origin: null,
		occurred_at: '2026-09-21T04:07:13.775Z'
	},
	{
		audit_id: 20,
		entity_type: 'request',
		entity_id: 'MAAT-8K3P-9X2M',
		action_type: 'request.override_status_admin',
		actor: user(102, 'Administrador Teste'),
		previous_value: '8',
		new_value: '11',
		note: 'Priorização extraordinária autorizada pela gerência.',
		change_origin: 'admin',
		occurred_at: '2026-09-20T18:22:05.000Z'
	},
	{
		audit_id: 19,
		entity_type: 'request',
		entity_id: 'MAAT-8K3P-9X2M',
		action_type: 'request.access_denied',
		actor: user(7, 'Ana Souza'),
		previous_value: null,
		new_value: null,
		note: 'Access denied: tentativa de definir status restrito (Priorizado) por não-administrador',
		change_origin: 'system',
		occurred_at: '2026-09-20T18:20:41.000Z'
	},
	{
		audit_id: 18,
		entity_type: 'request',
		entity_id: 'MAAT-8K3P-9X2M',
		action_type: 'request.status_change',
		actor: user(7, 'Ana Souza'),
		previous_value: '4',
		new_value: '7',
		note: 'Solicitante anexou o layout de entrada.',
		change_origin: 'internal',
		occurred_at: '2026-09-20T15:02:10.000Z'
	},
	{
		audit_id: 17,
		entity_type: 'request',
		entity_id: 'MAAT-8K3P-9X2M',
		action_type: 'request.assign',
		actor: user(2, 'Carla Dias'),
		previous_value: null,
		new_value: '7',
		note: null,
		change_origin: 'admin',
		occurred_at: '2026-09-18T15:05:44.000Z'
	},
	{
		audit_id: 16,
		entity_type: 'request',
		entity_id: 'MAAT-7C4F-1NXR',
		action_type: 'request.reassign',
		actor: user(2, 'Carla Dias'),
		previous_value: '7',
		new_value: '9',
		note: null,
		change_origin: 'admin',
		occurred_at: '2026-09-18T14:40:12.000Z'
	},
	{
		audit_id: 15,
		entity_type: 'request',
		entity_id: 'MAAT-7C4F-1NXR',
		action_type: 'request.unassign',
		actor: system(),
		previous_value: '9',
		new_value: null,
		note: 'Liberação automática na conclusão da triagem.',
		change_origin: 'system',
		occurred_at: '2026-09-18T14:39:58.000Z'
	},
	{
		audit_id: 14,
		entity_type: 'request',
		entity_id: 'MAAT-7C4F-1NXR',
		action_type: 'request.triage',
		actor: user(7, 'Ana Souza'),
		previous_value: null,
		new_value: '{"triageId":"660e8400-e29b-41d4-a716-446655440100","exitStatus":9}',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-18T14:39:57.000Z'
	},
	{
		audit_id: 13,
		entity_type: 'request',
		entity_id: 'MAAT-7C4F-1NXR',
		action_type: 'request.update',
		actor: user(7, 'Ana Souza'),
		previous_value: '{"title":"Ajuste de ponto"}',
		new_value: '{"title":"Ajuste de ponto e folga"}',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-18T14:30:00.000Z'
	},
	{
		audit_id: 12,
		entity_type: 'mapping',
		entity_id: 'b7e4d9c1-2a3f-4e8b-9c6d-5f1a2b3c4d5e',
		action_type: 'mapping.assign',
		actor: user(9, 'Júlia Reis'),
		previous_value: null,
		new_value: 'd3e2f1a0-b9c8-4d7e-8f6a-1b2c3d4e5f60',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-19T14:11:02.000Z'
	},
	{
		audit_id: 11,
		entity_type: 'mapping',
		entity_id: 'b7e4d9c1-2a3f-4e8b-9c6d-5f1a2b3c4d5e',
		action_type: 'mapping.save',
		actor: user(9, 'Júlia Reis'),
		previous_value: null,
		new_value: '{"targetStatus":6,"modality":"REMOTE"}',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-19T14:10:30.000Z'
	},
	{
		audit_id: 10,
		entity_type: 'mapping',
		entity_id: 'b7e4d9c1-2a3f-4e8b-9c6d-5f1a2b3c4d5e',
		action_type: 'mapping.complete',
		actor: user(9, 'Júlia Reis'),
		previous_value: null,
		new_value: '{"targetStatus":9}',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-19T16:45:00.000Z'
	},
	{
		audit_id: 9,
		entity_type: 'prioritization',
		entity_id: 'MAAT-8K3P-9X2M',
		action_type: 'prioritization.evaluate',
		actor: user(7, 'Ana Souza'),
		previous_value: null,
		new_value: '{"score":16,"priority":"Alta"}',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-18T16:10:00.000Z'
	},
	{
		audit_id: 8,
		entity_type: 'pending_item',
		entity_id: '4f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f',
		action_type: 'pending_item.create',
		actor: system(),
		previous_value: null,
		new_value: '{"field":"volumeMensal"}',
		note: null,
		change_origin: 'system',
		occurred_at: '2026-09-17T13:20:00.000Z'
	},
	{
		audit_id: 7,
		entity_type: 'pending_item',
		entity_id: '4f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f',
		action_type: 'pending_item.respond',
		actor: user(117, 'Sol Clean B108'),
		previous_value: null,
		new_value: '{"volumeMensal":"1200"}',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-17T14:05:00.000Z'
	},
	{
		audit_id: 6,
		entity_type: 'pending_item',
		entity_id: '4f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f',
		action_type: 'pending_item.attach',
		actor: user(117, 'Sol Clean B108'),
		previous_value: null,
		new_value: '{"file":"layout-entrada.xlsx"}',
		note: null,
		change_origin: 'internal',
		occurred_at: '2026-09-17T14:06:00.000Z'
	},
	{
		audit_id: 5,
		entity_type: 'pending_item',
		entity_id: '4f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f',
		action_type: 'pending_item.validate',
		actor: user(7, 'Ana Souza'),
		previous_value: null,
		new_value: null,
		note: 'Dados conferidos.',
		change_origin: 'internal',
		occurred_at: '2026-09-17T15:00:00.000Z'
	},
	{
		audit_id: 4,
		entity_type: 'pending_item',
		entity_id: '4f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f',
		action_type: 'pending_item.reopen',
		actor: user(7, 'Ana Souza'),
		previous_value: null,
		new_value: null,
		note: 'Anexo ilegível, solicitado novo envio.',
		change_origin: 'internal',
		occurred_at: '2026-09-17T16:30:00.000Z'
	},
	{
		audit_id: 3,
		entity_type: 'user',
		entity_id: '102',
		action_type: 'user.activate',
		actor: user(116, 'Gestor Teste'),
		previous_value: 'false',
		new_value: 'true',
		note: null,
		change_origin: null,
		occurred_at: '2026-09-16T11:00:00.000Z'
	},
	{
		audit_id: 2,
		entity_type: 'user',
		entity_id: '104',
		action_type: 'user.deactivate',
		actor: user(102, 'Administrador Teste'),
		previous_value: 'true',
		new_value: 'false',
		note: null,
		change_origin: null,
		occurred_at: '2026-09-16T10:45:00.000Z'
	},
	{
		audit_id: 1,
		entity_type: 'user',
		entity_id: '104',
		action_type: 'user.update_profile',
		actor: user(102, 'Administrador Teste'),
		previous_value: '{"profile":"Analista"}',
		new_value: '{"profile":"Gestor"}',
		note: null,
		change_origin: null,
		occurred_at: '2026-09-16T10:40:00.000Z'
	}
];

function toSummary(event: AuditHistoryDetail): AuditHistorySummary {
	return {
		audit_id: event.audit_id,
		entity_type: event.entity_type,
		entity_type_label: ENTITY_LABELS[event.entity_type] ?? event.entity_type,
		action_type: event.action_type,
		actor: event.actor,
		occurred_at: event.occurred_at
	};
}

export function listAuditHistoryMock(query: AuditHistoryQuery): AuditHistoryListResponse {
	const page = query.page ?? 1;
	const limit = query.limit ?? 20;
	const filtered = query.entityType
		? EVENTS.filter((event) => event.entity_type === query.entityType)
		: EVENTS;

	const start = (page - 1) * limit;

	return {
		items: filtered.slice(start, start + limit).map(toSummary),
		total: filtered.length,
		page,
		limit
	};
}

export function getAuditHistoryDetailMock(id: number): AuditHistoryDetail {
	const event = EVENTS.find((entry) => entry.audit_id === id);

	if (!event) {
		throw new ApiError(404, 'Log não encontrado');
	}

	return event;
}
