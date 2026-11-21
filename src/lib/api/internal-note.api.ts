import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	CreateInternalNotePayload,
	GetInternalNotesParams,
	InternalNotesResponse,
	MarkInternalNotesReadPayload,
	TimelineNote
} from '$lib/types/internal-note';

function internalNotesPath(protocol: string): string {
	return `/requests/${encodeURIComponent(protocol)}/internal-notes`;
}

function internalNotesQuery(params: GetInternalNotesParams): string {
	const query = new URLSearchParams();
	if (params.limit !== undefined) query.set('limit', String(params.limit));
	if (params.cursor !== undefined) query.set('cursor', params.cursor);
	const search = query.toString();
	return search ? `?${search}` : '';
}

// Página da timeline (mais-recente-primeiro) + nextCursor + unseenCount +
// registros finais. Sem params = página inicial lazy (D-N7).
export async function getInternalNotes(
	protocol: string,
	params: GetInternalNotesParams = {},
	fetchImpl?: typeof fetch
): Promise<InternalNotesResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.internalNotes) {
		const { getInternalNotesMock } = await import('$lib/mocks/internal-notes.mock');
		return getInternalNotesMock(protocol, params);
	}

	return apiClient<InternalNotesResponse>(
		`${internalNotesPath(protocol)}${internalNotesQuery(params)}`,
		{},
		fetchImpl
	);
}

export async function createInternalNote(
	protocol: string,
	payload: CreateInternalNotePayload
): Promise<TimelineNote> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.internalNotes) {
		const { createInternalNoteMock } = await import('$lib/mocks/internal-notes.mock');
		return createInternalNoteMock(protocol, payload);
	}

	return apiClient<TimelineNote>(internalNotesPath(protocol), {
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
