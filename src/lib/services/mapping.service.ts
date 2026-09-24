import { getMapping as getMappingApi, saveMapping as saveMappingApi } from '$lib/api/mapping.api';
import {
	MAPPING_SCHEDULED_STATUS_ID,
	type MappingDraft,
	type MappingParticipant,
	type MappingPayload,
	type MappingResponse
} from '$lib/types/mapping';
import { ApiError } from '$lib/types/result';
import { parseNumber } from '$lib/utils/validations';

export interface MappingServiceError {
	status?: number;
	message: string;
}

export type MappingResult<T> = { ok: true; data: T } | { ok: false; error: MappingServiceError };

function emptyToNull(value: string): string | null {
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}

// Converte o `datetime-local` do formulário (`yyyy-mm-ddThh:mm`, hora local)
// para ISO-8601. `new Date(...)` interpreta no timezone do ambiente e
// `toISOString()` serializa em UTC — nenhum offset fixo no código.
export function datetimeLocalToIso(value: string): string | null {
	const trimmed = value.trim();
	if (trimmed === '') return null;
	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime())) return null;
	return date.toISOString();
}

function normalizeParticipants(participants: MappingParticipant[]): MappingPayload['participants'] {
	return participants
		.map((participant) => ({
			...(participant.id ? { id: participant.id } : {}),
			name: participant.name.trim(),
			email: participant.email.trim()
		}))
		.filter((participant) => participant.name !== '' || participant.email !== '');
}

// Monta o payload do PUT a partir do rascunho do formulário. O frontend envia
// somente conclusão (`completeMapping: true`); o backend valida, persiste e
// muda o status para o `targetStatus` — o frontend nunca altera status
// diretamente. v4 inclui `targetStatus/mappingAssigneeId/justification/
// lastTechnicalMessage` quando em conclusão. Quando `targetStatus !== 6` a
// reunião é travada: os campos de reunião vão como `null` (valores preservados
// só no draft).
export function buildMappingPayload(draft: MappingDraft): MappingPayload {
	const targetStatus = draft.targetStatus ? Number(draft.targetStatus) : null;
	const isScheduled = targetStatus === MAPPING_SCHEDULED_STATUS_ID;
	const modality = isScheduled ? (draft.modality === '' ? null : draft.modality) : null;
	const duration = isScheduled ? parseNumber((draft.durationMinutes ?? '').trim()) : null;
	return {
		scheduledFor: isScheduled ? datetimeLocalToIso(draft.scheduledFor) : null,
		durationMinutes: duration === null ? null : duration,
		modality,
		meetingLink: isScheduled && modality === 'REMOTE' ? emptyToNull(draft.meetingLink ?? '') : null,
		location: isScheduled && modality === 'IN_PERSON' ? emptyToNull(draft.location ?? '') : null,
		participants: isScheduled ? normalizeParticipants(draft.participants) : [],
		notes: isScheduled ? emptyToNull(draft.notes ?? '') : null,
		completeMapping: true,
		targetStatus,
		mappingAssigneeId: draft.mappingAssigneeId?.trim() ? draft.mappingAssigneeId.trim() : null,
		justification: draft.justification?.trim() ? draft.justification.trim() : null,
		lastTechnicalMessage: draft.lastTechnicalMessage?.trim()
			? draft.lastTechnicalMessage.trim()
			: null
	};
}

// Mensagens por status seguindo o envelope de erro do projeto.
export function resolveMappingError(error: ApiError): MappingServiceError {
	switch (error.status) {
		case 400:
			return { status: error.status, message: 'Dados inválidos. Revise os campos do mapeamento.' };
		case 403:
			return {
				status: error.status,
				message: 'Você não tem permissão para editar o mapeamento.'
			};
		case 404:
			return { status: error.status, message: 'Solicitação não encontrada.' };
		case 422:
			return {
				status: error.status,
				message: error.message || 'Revise os campos do mapeamento.'
			};
		case 500:
			return {
				status: error.status,
				message: 'Erro interno. Tente novamente mais tarde.'
			};
		default:
			return { status: error.status, message: error.message };
	}
}

export async function getMapping(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<MappingResult<MappingResponse | null>> {
	try {
		const data = await getMappingApi(protocol, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: resolveMappingError(error) };
		}
		return { ok: false, error: { message: 'Não foi possível carregar o agendamento.' } };
	}
}

export async function saveMapping(
	protocol: string,
	payload: MappingPayload,
	fetchImpl?: typeof fetch
): Promise<MappingResult<MappingResponse>> {
	try {
		const data = await saveMappingApi(protocol, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: resolveMappingError(error) };
		}
		return { ok: false, error: { message: 'Não foi possível concluir o mapeamento.' } };
	}
}
