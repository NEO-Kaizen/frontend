import { MOCK_DOMAINS } from '$lib/mocks';
import type { MappingDetail, SaveMappingPayload } from '$lib/types/mapping';
import { ApiError, type Result } from '$lib/types/result';

// Service do agendamento de mapeamento.
//
// TODO(backend): não existe endpoint para duração, modalidade, local,
// participantes e observações — o contrato interno cobre apenas
// `mappingDate`/`meeting`/`schedulePreferences`. Enquanto o backend não expuser
// o contrato, a persistência usa o mock isolado (`mapping.mock.ts`) em DEV.
// Quando o endpoint existir, trocar o ramo DEV por uma função em
// `$lib/api/request.api.ts` mantendo estas assinaturas.
export async function getMapping(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<MappingDetail | null>> {
	// Reservado para o `fetch` do load/SSR quando o endpoint real existir
	// (mesma assinatura de `request.service`, que repassa ao `apiClient`).
	void fetchImpl;
	try {
		if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.mapping) {
			const { getMappingMock } = await import('$lib/mocks/mapping.mock');
			const data = await getMappingMock(protocol);
			return { ok: true, data };
		}
		return {
			ok: false,
			error: {
				message: 'Agendamento de mapeamento ainda não disponível no servidor.'
			}
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: { status: error.status, message: error.message } };
		}
		return { ok: false, error: { message: 'Não foi possível carregar o agendamento.' } };
	}
}

export async function saveMapping(
	protocol: string,
	payload: SaveMappingPayload,
	fetchImpl?: typeof fetch
): Promise<Result<MappingDetail>> {
	// Ver `getMapping` sobre `fetchImpl`.
	void fetchImpl;
	try {
		if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.mapping) {
			const { saveMappingMock } = await import('$lib/mocks/mapping.mock');
			const data = await saveMappingMock(protocol, payload);
			return { ok: true, data };
		}
		return {
			ok: false,
			error: {
				message: 'Agendamento de mapeamento ainda não disponível no servidor.'
			}
		};
	} catch (error) {
		if (error instanceof ApiError) {
			const message = error.status === 404 ? 'Solicitação não encontrada.' : error.message;
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível salvar o agendamento.' } };
	}
}
