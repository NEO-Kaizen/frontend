import { getMapping as getMappingApi, saveMapping as saveMappingApi } from '$lib/api/mapping.api';
import type {
	MappingDraft,
	MappingParticipant,
	MappingPayload,
	MappingResponse
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
// muda o status — o frontend nunca altera status diretamente.
export function buildMappingPayload(draft: MappingDraft): MappingPayload {
	const modality = draft.modality === '' ? null : draft.modality;
	const duration = parseNumber(draft.durationMinutes.trim());
	return {
		scheduledFor: datetimeLocalToIso(draft.scheduledFor),
		durationMinutes: duration === null ? null : duration,
		modality,
		meetingLink: modality === 'REMOTE' ? emptyToNull(draft.meetingLink) : null,
		location: modality === 'IN_PERSON' ? emptyToNull(draft.location) : null,
		participants: normalizeParticipants(draft.participants),
		notes: emptyToNull(draft.notes),
		completeMapping: true
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
