import { getMeMock } from './auth.mock';
import type {
	CreateInternalNotePayload,
	InternalNote,
	InternalNotesResponse,
	MarkInternalNotesReadPayload
} from '$lib/types/internal-note';
import { ApiError } from '$lib/types/result';

const MOCK_LATENCY_MS = 350;
let nextInternalNoteId = 3;

const internalNotesStore = new Map<string, InternalNote[]>([
	[
		'MAAT-8K3P-9X2M',
		[
			{
				id: '1',
				content:
					'Os critérios iniciais foram revisados. Precisamos confirmar a alçada de aprovação antes do mapeamento.',
				createdAt: '2026-09-18T13:45:00.000Z',
				author: { id: '1', name: 'Ana Souza', role: 'Analista' }
			},
			{
				id: '2',
				content: 'A área responsável foi acionada e deve retornar até o fim do dia.',
				createdAt: '2026-09-18T16:20:00.000Z',
				author: { id: '2', name: 'Marcos Lima', role: 'Gestor' }
			}
		]
	]
]);

const unseenCountByProtocol = new Map<string, number>([['MAAT-8K3P-9X2M', 2]]);

function normalizeProtocol(protocol: string): string {
	return protocol.trim().toUpperCase();
}

function delay<T>(value: T): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export function getInternalNotesMock(protocol: string): Promise<InternalNotesResponse> {
	const normalized = normalizeProtocol(protocol);
	const items = internalNotesStore.get(normalized) ?? [];
	return delay({
		items: structuredClone(items),
		unseenCount: unseenCountByProtocol.get(normalized) ?? 0
	});
}

export async function createInternalNoteMock(
	protocol: string,
	payload: CreateInternalNotePayload
): Promise<InternalNote> {
	const normalized = normalizeProtocol(protocol);
	const currentUser = await getMeMock();
	if (currentUser.role === 'Solicitante') {
		throw new ApiError(403, 'Acesso restrito aos perfis internos.');
	}

	const note: InternalNote = {
		id: String(nextInternalNoteId++),
		content: payload.content.trim(),
		createdAt: new Date().toISOString(),
		author: {
			id: currentUser.id,
			name: currentUser.name,
			role: currentUser.role
		}
	};
	const items = internalNotesStore.get(normalized) ?? [];
	internalNotesStore.set(normalized, [...items, note]);

	return delay(structuredClone(note));
}

export function markInternalNotesReadMock(
	protocol: string,
	payload: MarkInternalNotesReadPayload
): Promise<void> {
	if (!/^[1-9]\d*$/.test(payload.lastReadNoteId)) {
		return Promise.reject(new ApiError(400, 'Identificador da observação inválido.'));
	}
	unseenCountByProtocol.set(normalizeProtocol(protocol), 0);
	return delay(undefined);
}
