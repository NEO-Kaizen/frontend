import { updateTriage as updateTriageApi } from '$lib/api/triage.api';
import type { InternalRequestDetail } from '$lib/types/request';
import type { TriageAssessment } from '$lib/types/triage';
import { ApiError, type Result } from '$lib/types/result';

export async function updateTriage(
	protocol: string,
	payload: TriageAssessment,
	fetchImpl?: typeof fetch
): Promise<Result<InternalRequestDetail>> {
	try {
		const data = await updateTriageApi(protocol, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 404
					? 'Solicitação não encontrada.'
					: error.status === 403
						? 'Você não tem permissão para realizar a triagem.'
						: 'Não foi possível salvar a triagem.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível salvar a triagem.' } };
	}
}
