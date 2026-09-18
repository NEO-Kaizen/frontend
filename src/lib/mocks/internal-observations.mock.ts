import type {
	CreateInternalObservationPayload,
	InternalObservation,
	InternalObservationsData
} from '$lib/types/internal-observation';
import { getMeMock } from './auth.mock';

const observationsByProtocol = new Map<string, InternalObservation[]>([
	[
		'maat-7c4f-1nxr',
		[
			{
				id: 'obs-001',
				content:
					'Solicitação analisada. Necessário confirmar o impacto operacional antes de avançar.',
				author: {
					id: 'user-001',
					name: 'Carlos Silva',
					role: 'Analista'
				},
				createdAt: '2026-10-08T09:30:00'
			},
			{
				id: 'obs-002',
				content: 'Aguardando retorno da área responsável com as informações complementares.',
				author: {
					id: 'user-002',
					name: 'Mariana Costa',
					role: 'Gestora'
				},
				createdAt: '2026-10-08T10:15:00'
			},
			{
				id: 'obs-003',
				content: 'Impacto confirmado com a área responsável. Podemos avançar para a priorização.',
				author: {
					id: '1',
					name: 'Ana Souza',
					role: 'Analista'
				},
				createdAt: '2026-10-08T11:05:00'
			}
		]
	],
	['maat-8k3p-9x2m', []]
]);

function normalizeProtocol(protocol: string): string {
	return protocol.toLowerCase().trim();
}

export function getInternalObservationsMock(protocol: string): Promise<InternalObservationsData> {
	const normalized = normalizeProtocol(protocol);
	const observations = observationsByProtocol.get(normalized) ?? [];

	return Promise.resolve({
		observations: [...observations]
	});
}

export async function createInternalObservationMock(
	protocol: string,
	payload: CreateInternalObservationPayload
): Promise<InternalObservation> {
	const normalized = normalizeProtocol(protocol);
	const observations = observationsByProtocol.get(normalized) ?? [];

	const sessionUser = await getMeMock();

	const observation: InternalObservation = {
		id: `obs-${Date.now()}`,
		content: payload.content.trim(),
		author: {
			id: sessionUser.id,
			name: sessionUser.name,
			role: sessionUser.role
		},
		createdAt: new Date().toISOString()
	};

	observationsByProtocol.set(normalized, [...observations, observation]);

	return Promise.resolve(observation);
}
