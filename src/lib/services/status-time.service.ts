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
import type { StatusInterval, StatusTimeEntry, StatusTimesResponse } from '$lib/types/status-time';

// RF13 — tempo por Status e auditoria por protocolo. Os dados externos são
// validados antes de chegar à UI: payload fora do contrato vira erro, nunca
// valores exibidos incorretamente. O `status` HTTP segue no erro para a tela
// escolher o estado (ex.: 403 sem "Tentar novamente").

const INVALID_PAYLOAD_MESSAGE = 'Dados de tempo inválidos recebidos do servidor.';
const INVALID_AUDIT_MESSAGE = 'Dados de auditoria inválidos recebidos do servidor.';
const STATUS_HISTORY_DIVERGENCE_CODE = 'STATUS_HISTORY_DIVERGENCE';

// Mensagens por status (padrão de `internal-note.service`). Para Analista, o
// backend responde 403 também para protocolo inexistente — por isso o texto
// do 403 não afirma que a solicitação existe.
function resolveStatusTimeError(error: ApiError, fallback: string): string {
	if (error.status === 409 && error.code === STATUS_HISTORY_DIVERGENCE_CODE) {
		return 'O histórico de Status desta solicitação está inconsistente e o tempo não pôde ser calculado.';
	}

	switch (error.status) {
		case 401:
			return 'Sua sessão expirou. Entre novamente para continuar.';
		case 403:
			return 'Não foi possível exibir os dados desta solicitação. Verifique se você tem acesso a ela.';
		case 404:
			return 'Solicitação não encontrada.';
		default:
			return fallback;
	}
}

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
		return { ok: false, error: toError(error, 'Não foi possível carregar o tempo por Status.') };
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
		return {
			ok: false,
			error: toError(error, 'Não foi possível carregar os eventos de alteração de Status.')
		};
	}
}

// `/audit-logs/{protocol}` devolve todos os eventos da solicitação; a
// timeline de Status mostra apenas as ações da seção 3 do contrato.
export function filterStatusAuditEvents(events: RequestAuditEvent[]): RequestAuditEvent[] {
	return events.filter((event) =>
		(STATUS_AUDIT_ACTION_TYPES as readonly string[]).includes(event.action_type)
	);
}

export interface StatusTransition {
	from: string | null;
	to: string | null;
}

// Nomes de Status de um evento da timeline. Em `request.triage` o backend
// grava `previous_value`/`new_value` como JSON (`{"status": "...", ...}`) —
// o mesmo formato exibido no Histórico de Logs; nos demais eventos, o valor
// já é o nome do Status. Valor que não puder ser interpretado é exibido como
// veio, nunca descartado.
export function getStatusTransition(event: RequestAuditEvent): StatusTransition {
	if (event.action_type !== 'request.triage') {
		return { from: event.previous_value, to: event.new_value };
	}

	return {
		from: readStatusFromJson(event.previous_value),
		to: readStatusFromJson(event.new_value)
	};
}

function readStatusFromJson(value: string | null): string | null {
	if (value === null) return null;

	try {
		const parsed: unknown = JSON.parse(value);
		if (isRecord(parsed) && typeof parsed.status === 'string') return parsed.status;
	} catch {
		// Texto simples: segue para o retorno abaixo.
	}

	return value;
}

// ---- Validação do payload ----

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ISO 8601 UTC do contrato (`2026-11-20T14:22:45.736Z`). `Date.parse` sozinho
// aceita formatos locais e datas inexistentes (`2026-02-30` vira 02/03): o
// formato é conferido por regex e a data, pela volta via `toISOString()`.
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

function isIsoDate(value: unknown): value is string {
	if (typeof value !== 'string' || !ISO_UTC_PATTERN.test(value)) return false;

	const time = Date.parse(value);
	if (Number.isNaN(time)) return false;

	// Compara até os segundos — a fração de milissegundos pode ter 1 a 3 dígitos.
	return new Date(time).toISOString().slice(0, 19) === value.slice(0, 19);
}

function isDuration(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isNullableString(value: unknown): value is string | null {
	return value === null || typeof value === 'string';
}

function isStatusTimeEntry(value: unknown): value is StatusTimeEntry {
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
		isStatusTimeEntry(value)
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
		value.totalsByStatus.every(isStatusTimeEntry) &&
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

function toError(error: unknown, fallback: string): { status?: number; message: string } {
	if (error instanceof ApiError) {
		return { status: error.status, message: resolveStatusTimeError(error, fallback) };
	}

	return { message: 'Não foi possível conectar ao servidor.' };
}
