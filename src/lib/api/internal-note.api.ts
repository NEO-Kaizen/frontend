import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	CreateInternalNotePayload,
	InternalNote,
	InternalNotesResponse,
	MarkInternalNotesReadPayload
} from '$lib/types/internal-note';

function internalNotesPath(protocol: string): string {
	return `/requests/${encodeURIComponent(protocol)}/internal-notes`;
}

export async function getInternalNotes(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<InternalNotesResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.internalNotes) {
		const { getInternalNotesMock } = await import('$lib/mocks/internal-notes.mock');
		return getInternalNotesMock(protocol);
	}

	return apiClient<InternalNotesResponse>(internalNotesPath(protocol), {}, fetchImpl);
}

export async function createInternalNote(
	protocol: string,
	payload: CreateInternalNotePayload
): Promise<InternalNote> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.internalNotes) {
		const { createInternalNoteMock } = await import('$lib/mocks/internal-notes.mock');
		return createInternalNoteMock(protocol, payload);
	}

	return apiClient<InternalNote>(internalNotesPath(protocol), {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export async function markInternalNotesRead(
	protocol: string,
	payload: MarkInternalNotesReadPayload
): Promise<void> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.internalNotes) {
		const { markInternalNotesReadMock } = await import('$lib/mocks/internal-notes.mock');
		return markInternalNotesReadMock(protocol, payload);
	}

	await apiClient<void>(`${internalNotesPath(protocol)}/read`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
}
