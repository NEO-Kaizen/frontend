import { updateRequestStatus as updateRequestStatusApi } from '$lib/api/status.api';
import { ApiError, type Result } from '$lib/types/result';
import type { UpdateStatusRequest, UpdateStatusResponse } from '$lib/types/request';

export async function updateRequestStatus(
	protocol: string,
	payload: UpdateStatusRequest
): Promise<Result<UpdateStatusResponse>> {
	try {
		const data = await updateRequestStatusApi(protocol, payload);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: { status: error.status, message: error.message } };
		}
		return { ok: false, error: { message: 'Não foi possível atualizar o status.' } };
	}
}
