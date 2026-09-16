import { MOCK_DOMAINS } from '$lib/mocks';
import type { MappingDetail, SaveMappingPayload } from '$lib/types/mapping';
import { ApiError } from '$lib/types/result';

// O backend ainda não expõe contrato para os campos estendidos (duração,
// modalidade, local, participantes, observações)
// Quando o contrato existir, as chamadas via `apiClient` entram neste arquivo
// seguindo o padrão dos demais `*.api.ts`, sem tocar o service.
export async function getMapping(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<MappingDetail | null> {

	void fetchImpl;

	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.mapping) {
		const { getMappingMock } = await import('$lib/mocks/mapping.mock');
		return getMappingMock(protocol);
	}
	throw new ApiError(501, 'Agendamento de mapeamento ainda não disponível no servidor.');
}

export async function saveMapping(
	protocol: string,
	payload: SaveMappingPayload,
	fetchImpl?: typeof fetch
): Promise<MappingDetail> {
	
	void fetchImpl;
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.mapping) {
		const { saveMappingMock } = await import('$lib/mocks/mapping.mock');
		return saveMappingMock(protocol, payload);
	}
	throw new ApiError(501, 'Agendamento de mapeamento ainda não disponível no servidor.');
}
