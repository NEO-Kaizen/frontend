import {
	getRequestAuditLogs as getRequestAuditLogsApi,
	getStatusTimes as getStatusTimesApi
} from '$lib/api/status-time.api';

import {
	STATUS_AUDIT_ACTION_TYPES,
	type AuditActor,
	type RequestAuditEvent
} from '$lib/types/audit';
import { ApiError, type Result } from '$lib/types/result';
import type { StatusInterval, StatusTimesResponse, StatusTotal } from '$lib/types/status-time';

// RF13 — tempo por Status e auditoria por protocolo. Os dados externos são
// validados antes de chegar à UI: payload fora do contrato vira erro, nunca
// valores exibidos incorretamente. 403/404 são repassados com o status — a
// mensagem exibida é decidida pela tela (para Analista, 403 também mascara
// protocolo inexistente).

const INVALID_PAYLOAD_MESSAGE = 'Dados de tempo inválidos recebidos do servidor.';
const INVALID_AUDIT_MESSAGE = 'Dados de auditoria inválidos recebidos do servidor.';

export async function getStatusTimes(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<StatusTimesResponse>> {
	try {
		const data = await getStatusTimesApi(protocol, fetchImpl);

		if (!isStatusTimesResponse(data)) {
			return { ok: false, error: { message: INVALID_PAYLOAD_MESSAGE } };
		}

		return { ok: true, data };
	} catch (error) {
		return { ok: false, error: toError(error) };
	}
}

export async function getRequestAuditLogs(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<RequestAuditEvent[]>> {
	try {
		const data = await getRequestAuditLogsApi(protocol, fetchImpl);

		if (!Array.isArray(data) || !data.every(isRequestAuditEvent)) {
			return { ok: false, error: { message: INVALID_AUDIT_MESSAGE } };
		}

		return { ok: true, data };
	} catch (error) {
		return { ok: false, error: toError(error) };
	}
}

// `/audit-logs/{protocol}` devolve todos os eventos da solicitação; a
// timeline de Status mostra apenas as ações da seção 3 do contrato.
export function filterStatusAuditEvents(events: RequestAuditEvent[]): RequestAuditEvent[] {
	return events.filter((event) =>
		(STATUS_AUDIT_ACTION_TYPES as readonly string[]).includes(event.action_type)
	);
}

// ---- Validação do payload ----

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isDuration(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isNullableString(value: unknown): value is string | null {
	return value === null || typeof value === 'string';
}

function isStatusTotal(value: unknown): value is StatusTotal {
	return (
		isRecord(value) &&
		typeof value.status === 'string' &&
		isDuration(value.activeMilliseconds) &&
		isDuration(value.pausedMilliseconds) &&
		typeof value.isPaused === 'boolean'
	);
}

function isStatusInterval(value: unknown): value is StatusInterval {
	return (
		isRecord(value) &&
		isIsoDate(value.enteredAt) &&
		(value.exitedAt === null || isIsoDate(value.exitedAt)) &&
		isStatusTotal(value)
	);
}

function isStatusTimesResponse(value: unknown): value is StatusTimesResponse {
	return (
		isRecord(value) &&
		typeof value.protocol === 'string' &&
		isIsoDate(value.calculatedAt) &&
		Array.isArray(value.intervals) &&
		value.intervals.every(isStatusInterval) &&
		Array.isArray(value.totalsByStatus) &&
		value.totalsByStatus.every(isStatusTotal) &&
		isDuration(value.totalActiveMilliseconds) &&
		isDuration(value.totalPausedMilliseconds)
	);
}

function isAuditActor(value: unknown): value is AuditActor {
	return (
		isRecord(value) &&
		(value.kind === 'system' || value.kind === 'user') &&
		(value.userId === null || typeof value.userId === 'number') &&
		isNullableString(value.displayName)
	);
}

function isRequestAuditEvent(value: unknown): value is RequestAuditEvent {
	return (
		isRecord(value) &&
		typeof value.audit_id === 'number' &&
		typeof value.entity_type === 'string' &&
		typeof value.entity_id === 'string' &&
		typeof value.action_type === 'string' &&
		isAuditActor(value.actor) &&
		isNullableString(value.previous_value) &&
		isNullableString(value.new_value) &&
		isNullableString(value.note) &&
		isNullableString(value.last_technical_message) &&
		isNullableString(value.ip_address) &&
		isNullableString(value.change_origin) &&
		isIsoDate(value.occurred_at)
	);
}

function toError(error: unknown): { status?: number; message: string } {
	if (error instanceof ApiError) {
		return { status: error.status, message: error.message };
	}

	return { message: 'Não foi possível conectar ao servidor.' };
}
