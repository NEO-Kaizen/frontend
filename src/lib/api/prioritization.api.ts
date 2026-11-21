import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	EvaluatePrioritizationRequest,
	EvaluatePrioritizationResponse,
	ListCriteriaResponse
} from '$lib/types/prioritization';

const PRIORITIZATION_PATH = '/prioritization';

// GET /prioritization/criteria — lista os critérios ativos com seus pesos
// (fonte: `criteria.weight`, D-O3). Alimenta o formulário de avaliação.
export async function getPrioritizationCriteria(): Promise<ListCriteriaResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.prioritization) {
		const { getPrioritizationCriteriaMock } = await import('$lib/mocks/prioritization.mock');
		return getPrioritizationCriteriaMock();
	}

	return apiClient<ListCriteriaResponse>(`${PRIORITIZATION_PATH}/criteria`);
}

// PUT /prioritization/:protocol/score — envia apenas as notas por critério.
// Score e classificação são calculados pelo Backend (RN-007/RN-008) — o
// Frontend não envia score final como fonte de verdade.
export async function savePrioritization(
	protocol: string,
	payload: EvaluatePrioritizationRequest
): Promise<EvaluatePrioritizationResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.prioritization) {
		const { savePrioritizationMock } = await import('$lib/mocks/prioritization.mock');
		return savePrioritizationMock(protocol, payload.notes);
	}

	const encoded = encodeURIComponent(protocol);

	return apiClient<EvaluatePrioritizationResponse>(`${PRIORITIZATION_PATH}/${encoded}/score`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
}
