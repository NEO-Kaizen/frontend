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
			id: 'b7e4d9c1-2a3f-4e8b-9c6d-5f1a2b3c4d5e',
			scheduledFor: '2026-10-15T10:30:00-03:00',
			durationMinutes: 60,
			modality: 'REMOTE',
			meetingLink: 'https://meet.exemplo.br/mapeamento-8k3p-9x2m',
			location: null,
			participants: [
				{ id: 'mapping-seed-1', name: 'Maria Oliveira', email: 'maria.oliveira@maat.com.br' },
				{ id: 'mapping-seed-2', name: 'Fernando Alves', email: 'fernando.alves@maat.com.br' }
			],
			notes: null,
			mappingAssignee: {
				id: 'd3e2f1a0-b9c8-4d7e-8f6a-1b2c3d4e5f60',
				userId: '9',
				name: 'Júlia Reis',
				email: 'julia.reis@exemplo.br',
				jobTitle: 'Analista de Processos'
			}
		}
	],
	[
		'MAAT-6N2W-8VBM',
		{
			protocol: 'MAAT-6N2W-8VBM',
			id: null,
			scheduledFor: null,
			durationMinutes: null,
			modality: null,
			meetingLink: null,
			location: null,
			participants: [],
			notes: null,
			mappingAssignee: null
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

// PUT: persiste os dados; `completeMapping: true` valida/ecoa `targetStatus`
// (no backend real ele também muda o status para o alvo e persiste
// `lastTechnicalMessage`/`lastUpdate` — o frontend nunca altera status
// diretamente, então o mock só espelha os campos v4 na resposta).
export function saveMappingMock(
	protocol: string,
	payload: MappingPayload
): Promise<MappingResponse> {
	const normalized = normalizeProtocol(protocol);
	if (!normalized) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}
	if (
		payload.completeMapping &&
		(payload.targetStatus === null || payload.targetStatus === undefined)
	) {
		return Promise.reject(new ApiError(422, 'Selecione o status de destino do mapeamento.'));
	}
	const participants: MappingParticipant[] = payload.participants.map((participant) => ({
		...(participant.id ? { id: participant.id } : {}),
		name: participant.name,
		email: participant.email
	}));
	const previous = mappingStore.get(normalized);
	const detail: MappingResponse = {
		protocol: normalized,
		id: previous?.id ?? crypto.randomUUID(),
		scheduledFor: payload.scheduledFor,
		durationMinutes: payload.durationMinutes,
		modality: payload.modality,
		meetingLink: payload.meetingLink,
		location: payload.location,
		participants,
		notes: payload.notes,
		mappingAssignee: previous?.mappingAssignee ?? null,
		mappingAssigneeId: payload.mappingAssigneeId ?? previous?.mappingAssigneeId ?? null,
		targetStatus: payload.targetStatus ?? previous?.targetStatus ?? null,
		justification: payload.justification ?? null,
		lastTechnicalMessage: payload.lastTechnicalMessage ?? null
	};
	mappingStore.set(normalized, detail);
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(detail));
}
