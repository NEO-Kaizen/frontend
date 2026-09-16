import { getMapping as getMappingApi, saveMapping as saveMappingApi } from '$lib/api/mapping.api';
import type { MappingDetail, SaveMappingPayload } from '$lib/types/mapping';
import { ApiError, type Result } from '$lib/types/result';

export async function getMapping(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<MappingDetail | null>> {
	try {
		const data = await getMappingApi(protocol, fetchImpl);
		return { ok: true, data };
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
	try {
		const data = await saveMappingApi(protocol, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message = error.status === 404 ? 'Solicitação não encontrada.' : error.message;
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível salvar o agendamento.' } };
	}
}
