import { ApiError } from '$lib/types/result';
import type { MappingDetail, MappingParticipant, SaveMappingPayload } from '$lib/types/mapping';

// Mock isolado dos campos estendidos do mapeamento (duração, modalidade,
// local, participantes, observações). O contrato interno ainda não os expõe,
// então este armazenamento em memória é o ponto único a ser substituído pelo
// backend — nenhum componente conhece este arquivo, apenas o service.
//
// Dados 100% fictícios, seguindo o padrão de `$lib/mocks/requests.mock.ts`.
const MOCK_LATENCY_MS = 500;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sementes derivadas dos fixtures internos: protocolos que já possuem
// `meeting`/`mappingDate` começam com o agendamento correspondente.
const mappingStore = new Map<string, MappingDetail>([
	[
		'MAAT-8K3P-9X2M',
		{
			scheduledFor: '2026-10-15T10:30',
			durationMinutes: 60,
			modality: 'Remoto',
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
export function getMappingMock(protocol: string): Promise<MappingDetail | null> {
	const found = mappingStore.get(normalizeProtocol(protocol));
	return delay(MOCK_LATENCY_MS).then(() => (found ? structuredClone(found) : null));
}

export function saveMappingMock(
	protocol: string,
	payload: SaveMappingPayload
): Promise<MappingDetail> {
	const normalized = normalizeProtocol(protocol);
	if (!normalized) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}
	const participants: MappingParticipant[] = payload.participants.map((participant) => ({
		...participant
	}));
	const detail: MappingDetail = {
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
