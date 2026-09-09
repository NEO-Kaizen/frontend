import { apiClient } from './client';
import { getPrioritizationMock, savePrioritizationMock } from '$lib/mocks/prioritization';
import type {
	PrioritizationData,
	PrioritizationResult,
	SavePrioritizationPayload
} from '$lib/types/prioritization';

// TODO: Substituir o mock pela integração com a API quando o backend estiver disponível.
const USE_MOCK = false;

const REQUESTS_PATH = '/requests';

function prioritizationPath(protocol: string): string {
	const encoded = encodeURIComponent(protocol);
	return `${REQUESTS_PATH}/${encoded}/prioritization`;
}

// Carrega os critérios oficiais e as notas já existentes da solicitação
// (vazias na primeira avaliação; preenchidas numa reavaliação).
export function getPrioritization(protocol: string): Promise<PrioritizationData> {
	if (USE_MOCK) {
		return getPrioritizationMock(protocol);
	}

	return apiClient<PrioritizationData>(prioritizationPath(protocol));
}

// Envia apenas as notas por critério. O score e a classificação são calculados
// pelo Backend — o Frontend não envia score final como fonte de verdade.
export function savePrioritization(
	protocol: string,
	payload: SavePrioritizationPayload
): Promise<PrioritizationResult> {
	if (USE_MOCK) {
		return savePrioritizationMock(protocol, payload.notes);
	}

	return apiClient<PrioritizationResult>(prioritizationPath(protocol), {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}
