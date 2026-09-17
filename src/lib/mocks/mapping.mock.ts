import { ApiError } from '$lib/types/result';
import type { MappingParticipant, MappingPayload, MappingResponse } from '$lib/types/mapping';

// Mock isolado do contrato de mapeamento (GET/PUT
// /queue/requests/{protocol}/mapping). Ponto único a ser substituído pelo
// backend — nenhum componente conhece este arquivo, apenas o service.
//
// Dados 100% fictícios, seguindo o padrão de `$lib/mocks/requests.mock.ts`.
const MOCK_LATENCY_MS = 500;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sementes com ISO-8601 com offset (contrato): protocolo com agendamento e
// protocolo em estado vazio (campos `null`, `participants: []` — não erro).
const mappingStore = new Map<string, MappingResponse>([
	[
		'MAAT-8K3P-9X2M',
		{
			protocol: 'MAAT-8K3P-9X2M',
			scheduledFor: '2026-10-15T10:30:00-03:00',
			durationMinutes: 60,
			modality: 'REMOTE',
			meetingLink: 'https://meet.exemplo.br/mapeamento-8k3p-9x2m',
			location: null,
			participants: [
				{ id: 'mapping-seed-1', name: 'Maria Oliveira', email: 'maria.oliveira@maat.com.br' },
				{ id: 'mapping-seed-2', name: 'Fernando Alves', email: 'fernando.alves@maat.com.br' }
			],
			notes: null
		}
	],
	[
		'MAAT-6N2W-8VBM',
		{
			protocol: 'MAAT-6N2W-8VBM',
			scheduledFor: null,
			durationMinutes: null,
			modality: null,
			meetingLink: null,
			location: null,
			participants: [],
			notes: null
		}
	]
]);

function normalizeProtocol(protocol: string): string {
	return protocol.trim().toUpperCase();
}

// Protocolo sem agendamento retorna `null` (estado vazio, não erro) para que
// o formulário parta do `meeting` do contrato interno como fallback.
export function getMappingMock(protocol: string): Promise<MappingResponse | null> {
	const found = mappingStore.get(normalizeProtocol(protocol));
	return delay(MOCK_LATENCY_MS).then(() => (found ? structuredClone(found) : null));
}

// PUT: persiste os dados; `completeMapping: true` apenas persiste (no backend
// real ele também muda o status para "Mapeamento agendado" — o frontend nunca
// altera status diretamente, então o mock não toca na solicitação).
export function saveMappingMock(
	protocol: string,
	payload: MappingPayload
): Promise<MappingResponse> {
	const normalized = normalizeProtocol(protocol);
	if (!normalized) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}
	const participants: MappingParticipant[] = payload.participants.map((participant) => ({
		...(participant.id ? { id: participant.id } : {}),
		name: participant.name,
		email: participant.email
	}));
	const detail: MappingResponse = {
		protocol: normalized,
		scheduledFor: payload.scheduledFor,
		durationMinutes: payload.durationMinutes,
		modality: payload.modality,
		meetingLink: payload.meetingLink,
		location: payload.location,
		participants,
		notes: payload.notes
	};
	mappingStore.set(normalized, detail);
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(detail));
}
