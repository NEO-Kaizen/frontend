import {
	createInternalNote as createInternalNoteApi,
	getInternalNotes as getInternalNotesApi,
	markInternalNotesRead as markInternalNotesReadApi
} from '$lib/api/internal-note.api';
import {
	INTERNAL_NOTE_MAX_LENGTH,
	type CreateInternalNotePayload,
	type GetInternalNotesParams,
	type InternalNotesResponse,
	type TimelineNote
} from '$lib/types/internal-note';
import { ApiError, type Result } from '$lib/types/result';
import { isRetryableApiStatus } from '$lib/utils/api-error';

function resolveReadError(error: ApiError, fallback: string): string {
	switch (error.status) {
		case 401:
			return 'Sua sessão expirou. Entre novamente para continuar.';
		case 403:
			return 'Você não tem permissão para acessar as observações internas.';
		case 404:
			return 'Solicitação não encontrada.';
		default:
			return fallback;
	}
}

function resolveWriteError(error: ApiError, fallback: string): string {
	switch (error.status) {
		case 401:
			return 'Sua sessão expirou. Entre novamente para continuar.';
		case 403:
			return 'Seu perfil permite consultar as observações internas, mas não adicionar novas.';
		case 404:
			return 'Solicitação não encontrada.';
		default:
			return fallback;
	}
}

export function validateInternalNoteContent(content: string): string | null {
	const trimmed = content.trim();
	if (!trimmed) return 'Escreva uma observação antes de publicar.';
	if (trimmed.length > INTERNAL_NOTE_MAX_LENGTH) {
		return `A observação deve ter no máximo ${INTERNAL_NOTE_MAX_LENGTH} caracteres.`;
	}
	return null;
}

export async function getInternalNotes(
	protocol: string,
	params: GetInternalNotesParams = {},
	fetchImpl?: typeof fetch
): Promise<Result<InternalNotesResponse>> {
	try {
		return { ok: true, data: await getInternalNotesApi(protocol, params, fetchImpl) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					retryable: isRetryableApiStatus(error.status),
					message: resolveReadError(error, 'Não foi possível carregar as observações internas.')
				}
			};
		}
		return {
			ok: false,
			error: { retryable: true, message: 'Não foi possível conectar ao servidor.' }
		};
	}
}

export async function createInternalNote(
	protocol: string,
	content: string
): Promise<Result<TimelineNote>> {
	const validationError = validateInternalNoteContent(content);
	if (validationError) {
		return { ok: false, error: { retryable: false, message: validationError } };
	}

	const payload: CreateInternalNotePayload = { content: content.trim() };
	try {
		return { ok: true, data: await createInternalNoteApi(protocol, payload) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					retryable: isRetryableApiStatus(error.status),
					message: resolveWriteError(error, 'Não foi possível publicar a observação.')
				}
			};
		}
		return {
			ok: false,
			error: { retryable: true, message: 'Não foi possível conectar ao servidor.' }
		};
	}
}

export async function markInternalNotesRead(
	protocol: string,
	lastReadNoteId: string
): Promise<Result<void>> {
	try {
		await markInternalNotesReadApi(protocol, { lastReadNoteId });
		return { ok: true, data: undefined };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					retryable: isRetryableApiStatus(error.status),
					message: resolveReadError(
						error,
						'Não foi possível atualizar a visualização das observações.'
					)
				}
			};
		}
		return {
			ok: false,
			error: { retryable: true, message: 'Não foi possível conectar ao servidor.' }
		};
	}
}
