import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	PrioritizationData,
	PrioritizationResult,
	SavePrioritizationPayload
} from '$lib/types/prioritization';

const REQUESTS_PATH = '/requests';

function prioritizationPath(protocol: string): string {
	const encoded = encodeURIComponent(protocol);
	return `${REQUESTS_PATH}/${encoded}/prioritization`;
}

// Carrega os critérios oficiais e as notas já existentes da solicitação
// (vazias na primeira avaliação; preenchidas numa reavaliação).
export async function getPrioritization(protocol: string): Promise<PrioritizationData> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.prioritization) {
		const { getPrioritizationMock } = await import('$lib/mocks/prioritization.mock');
		return getPrioritizationMock(protocol);
	}

	return apiClient<PrioritizationData>(prioritizationPath(protocol));
}

// Envia apenas as notas por critério. O score e a classificação são calculados
// pelo Backend — o Frontend não envia score final como fonte de verdade.
export async function savePrioritization(
	protocol: string,
	payload: SavePrioritizationPayload
): Promise<PrioritizationResult> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.prioritization) {
		const { savePrioritizationMock } = await import('$lib/mocks/prioritization.mock');
		return savePrioritizationMock(protocol, payload.notes);
	}

	return apiClient<PrioritizationResult>(prioritizationPath(protocol), {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}
