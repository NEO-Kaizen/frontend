import { ApiError } from '$lib/types/result';

import type { AuditActor, RequestAuditEvent } from '$lib/types/audit';
import type { StatusInterval, StatusTimesResponse, StatusTotal } from '$lib/types/status-time';

// Dados fictícios do RF13 (tempo por Status + auditoria por protocolo).
// Cenários por protocolo (os mesmos protocolos de `requests.mock.ts`):
// - MAAT-8K3P-9X2M: fluxo completo com pausa e Status repetido;
// - MAAT-4P7K-2LQX: Status com nome antigo (renomeado, fora da config atual);
// - MAAT-9R3D-7KWF: sem intervalos registrados;
// - MAAT-5X8M-3QTP: 403 (Analista sem custódia);
// - MAAT-0000-0000: 404 (protocolo inexistente para Administrador/Gestor);
// - demais protocolos: somente o Status inicial em aberto.

const MOCK_LATENCY_MS = 350;
const CALCULATED_AT = '2026-11-20T14:22:45.736Z';
const FORBIDDEN_PROTOCOLS = new Set(['MAAT-5X8M-3QTP']);
const NOT_FOUND_PROTOCOLS = new Set(['MAAT-0000-0000']);

type RawInterval = [status: string, enteredAt: string, exitedAt: string | null, isPaused: boolean];

const INTERVALS_BY_PROTOCOL: Record<string, RawInterval[]> = {
	'MAAT-8K3P-9X2M': [
		['Solicitação enviada', '2026-11-17T09:00:00.000Z', '2026-11-17T09:30:00.000Z', false],
		['Em triagem', '2026-11-17T09:30:00.000Z', '2026-11-17T11:00:00.000Z', false],
		['Pendente de informações', '2026-11-17T11:00:00.000Z', '2026-11-18T15:00:00.000Z', true],
		['Em triagem', '2026-11-18T15:00:00.000Z', '2026-11-18T16:45:00.000Z', false],
		['Aguardando mapeamento', '2026-11-18T16:45:00.000Z', '2026-11-19T10:00:00.000Z', false],
		['Em mapeamento', '2026-11-19T10:00:00.000Z', null, false]
	],
	'MAAT-4P7K-2LQX': [
		['Triagem inicial', '2026-11-18T08:00:00.000Z', '2026-11-18T08:40:00.000Z', false],
		['Aguardando retorno', '2026-11-18T08:40:00.000Z', '2026-11-19T12:00:00.000Z', true],
		['Em triagem', '2026-11-19T12:00:00.000Z', null, false]
	],
	'MAAT-9R3D-7KWF': []
};

const DEFAULT_INTERVALS: RawInterval[] = [
	['Solicitação enviada', '2026-11-20T13:50:00.000Z', null, false]
];

function user(userId: number, displayName: string): AuditActor {
	return { kind: 'user', userId, displayName };
}

function system(): AuditActor {
	return { kind: 'system', userId: null, displayName: null };
}

function event(
	audit_id: number,
	protocol: string,
	action_type: string,
	actor: AuditActor,
	values: Partial<
		Pick<RequestAuditEvent, 'previous_value' | 'new_value' | 'note' | 'change_origin'>
	>,
	occurred_at: string
): RequestAuditEvent {
	return {
		audit_id,
		entity_type: 'request',
		entity_id: protocol,
		action_type,
		actor,
		previous_value: values.previous_value ?? null,
		new_value: values.new_value ?? null,
		note: values.note ?? null,
		last_technical_message: null,
		ip_address: '127.0.0.1',
		change_origin: values.change_origin ?? null,
		occurred_at
	};
}

// Inclui eventos que não são de Status (`request.assign`, `request.update`)
// para exercitar o filtro da tela. Ordem cronológica crescente — a UI não deve
// depender da ordem recebida.
const EVENTS_BY_PROTOCOL: Record<string, RequestAuditEvent[]> = {
	'MAAT-8K3P-9X2M': [
		event(
			101,
			'MAAT-8K3P-9X2M',
			'request.status_change',
			system(),
			{
				previous_value: 'Solicitação enviada',
				new_value: 'Em triagem',
				change_origin: 'system'
			},
			'2026-11-17T09:30:00.000Z'
		),
		event(
			102,
			'MAAT-8K3P-9X2M',
			'request.assign',
			user(102, 'Administrador Teste'),
			{ new_value: 'Analista Teste', change_origin: 'admin' },
			'2026-11-17T09:35:00.000Z'
		),
		event(
			103,
			'MAAT-8K3P-9X2M',
			'request.status_change',
			user(117, 'Analista Teste'),
			{
				previous_value: 'Em triagem',
				new_value: 'Pendente de informações',
				note: 'Aguardando documento complementar',
				change_origin: 'internal'
			},
			'2026-11-17T11:00:00.000Z'
		),
		event(
			104,
			'MAAT-8K3P-9X2M',
			'request.access_denied',
			user(118, 'Analista Externo'),
			{
				previous_value: 'Pendente de informações',
				new_value: 'Elegível',
				change_origin: 'internal'
			},
			'2026-11-18T10:12:00.000Z'
		),
		event(
			105,
			'MAAT-8K3P-9X2M',
			'request.status_change',
			system(),
			{
				previous_value: 'Pendente de informações',
				new_value: 'Em triagem',
				note: 'Pendência respondida pelo solicitante',
				change_origin: 'requester'
			},
			'2026-11-18T15:00:00.000Z'
		),
		event(
			106,
			'MAAT-8K3P-9X2M',
			'request.update',
			user(117, 'Analista Teste'),
			{ change_origin: 'internal' },
			'2026-11-18T16:00:00.000Z'
		),
		event(
			107,
			'MAAT-8K3P-9X2M',
			'request.triage',
			user(117, 'Analista Teste'),
			{
				previous_value: 'Em triagem',
				new_value: 'Aguardando mapeamento',
				change_origin: 'internal'
			},
			'2026-11-18T16:45:00.000Z'
		),
		event(
			108,
			'MAAT-8K3P-9X2M',
			'request.override_status_admin',
			user(102, 'Administrador Teste'),
			{
				previous_value: 'Aguardando mapeamento',
				new_value: 'Em mapeamento',
				note: 'Reunião antecipada',
				change_origin: 'admin'
			},
			'2026-11-19T10:00:00.000Z'
		)
	],
	'MAAT-4P7K-2LQX': [
		event(
			201,
			'MAAT-4P7K-2LQX',
			'request.status_change',
			user(117, 'Analista Teste'),
			{
				previous_value: 'Triagem inicial',
				new_value: 'Aguardando retorno',
				change_origin: 'internal'
			},
			'2026-11-18T08:40:00.000Z'
		),
		event(
			202,
			'MAAT-4P7K-2LQX',
			'request.status_change',
			system(),
			{
				previous_value: 'Aguardando retorno',
				new_value: 'Em triagem',
				change_origin: 'system'
			},
			'2026-11-19T12:00:00.000Z'
		)
	]
};

function toInterval([status, enteredAt, exitedAt, isPaused]: RawInterval): StatusInterval {
	const duration = Math.max(0, Date.parse(exitedAt ?? CALCULATED_AT) - Date.parse(enteredAt));

	return {
		status,
		enteredAt,
		exitedAt,
		activeMilliseconds: isPaused ? 0 : duration,
		pausedMilliseconds: isPaused ? duration : 0,
		isPaused
	};
}

// Espelha a consolidação feita pelo backend (ordem da primeira ocorrência).
function toTotals(intervals: StatusInterval[]): StatusTotal[] {
	const totals = new Map<string, StatusTotal>();

	for (const interval of intervals) {
		const total = totals.get(interval.status) ?? {
			status: interval.status,
			activeMilliseconds: 0,
			pausedMilliseconds: 0,
			isPaused: interval.isPaused
		};

		total.activeMilliseconds += interval.activeMilliseconds;
		total.pausedMilliseconds += interval.pausedMilliseconds;
		totals.set(interval.status, total);
	}

	return [...totals.values()];
}

function assertAccess(protocol: string): void {
	if (FORBIDDEN_PROTOCOLS.has(protocol)) {
		throw new ApiError(403, 'Acesso negado.');
	}

	if (NOT_FOUND_PROTOCOLS.has(protocol)) {
		throw new ApiError(404, 'Protocolo não encontrado');
	}
}

function delay<T>(value: T): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export function getStatusTimesMock(protocol: string): Promise<StatusTimesResponse> {
	assertAccess(protocol);

	const intervals = (INTERVALS_BY_PROTOCOL[protocol] ?? DEFAULT_INTERVALS).map(toInterval);

	return delay({
		protocol,
		calculatedAt: CALCULATED_AT,
		intervals,
		totalsByStatus: toTotals(intervals),
		totalActiveMilliseconds: intervals.reduce((sum, item) => sum + item.activeMilliseconds, 0),
		totalPausedMilliseconds: intervals.reduce((sum, item) => sum + item.pausedMilliseconds, 0)
	});
}

export function getRequestAuditLogsMock(protocol: string): Promise<RequestAuditEvent[]> {
	assertAccess(protocol);

	return delay(structuredClone(EVENTS_BY_PROTOCOL[protocol] ?? []));
}
