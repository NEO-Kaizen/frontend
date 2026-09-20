import {
	createInternalNote as createInternalNoteApi,
	getInternalNotes as getInternalNotesApi,
	markInternalNotesRead as markInternalNotesReadApi
} from '$lib/api/internal-note.api';
import {
	INTERNAL_NOTE_MAX_LENGTH,
	type CreateInternalNotePayload,
	type InternalNote,
	type InternalNotesResponse
} from '$lib/types/internal-note';
import { ApiError, type Result } from '$lib/types/result';

function resolveInternalNotesError(error: ApiError, fallback: string): string {
	switch (error.status) {
		case 403:
			return 'Você não tem permissão para acessar as observações internas.';
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
	fetchImpl?: typeof fetch
): Promise<Result<InternalNotesResponse>> {
	try {
		return { ok: true, data: await getInternalNotesApi(protocol, fetchImpl) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: resolveInternalNotesError(
						error,
						'Não foi possível carregar as observações internas.'
					)
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function createInternalNote(
	protocol: string,
	content: string
): Promise<Result<InternalNote>> {
	const validationError = validateInternalNoteContent(content);
	if (validationError) return { ok: false, error: { message: validationError } };

	const payload: CreateInternalNotePayload = { content: content.trim() };
	try {
		return { ok: true, data: await createInternalNoteApi(protocol, payload) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: resolveInternalNotesError(error, 'Não foi possível publicar a observação.')
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
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
					message: resolveInternalNotesError(
						error,
						'Não foi possível atualizar a visualização das observações.'
					)
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}
