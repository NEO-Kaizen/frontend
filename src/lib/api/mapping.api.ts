import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { MappingPayload, MappingResponse } from '$lib/types/mapping';

const QUEUE_REQUESTS_PATH = '/queue/requests';

// GET /queue/requests/{protocol}/mapping — estado vazio (campos `null` e
// `participants: []`) é resposta válida, não erro.
export async function getMapping(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<MappingResponse | null> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.mapping) {
		const { getMappingMock } = await import('$lib/mocks/mapping.mock');
		return getMappingMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<MappingResponse>(`${QUEUE_REQUESTS_PATH}/${encoded}/mapping`, {}, fetchImpl);
}

// PUT /queue/requests/{protocol}/mapping — o frontend envia somente conclusão
// (`completeMapping: true`; o backend valida, persiste e muda o status).
export async function saveMapping(
	protocol: string,
	payload: MappingPayload,
	fetchImpl?: typeof fetch
): Promise<MappingResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.mapping) {
		const { saveMappingMock } = await import('$lib/mocks/mapping.mock');
		return saveMappingMock(protocol, payload);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<MappingResponse>(
		`${QUEUE_REQUESTS_PATH}/${encoded}/mapping`,
		{
			method: 'PUT',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}
