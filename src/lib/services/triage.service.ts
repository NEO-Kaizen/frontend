import { createTriage as createTriageApi, getTriage as getTriageApi } from '$lib/api/triage.api';
import type { CreateTriagePayload, TriageAssessment } from '$lib/types/triage';
import { ApiError, type Result } from '$lib/types/result';

export async function createTriage(
	protocol: string,
	payload: CreateTriagePayload,
	fetchImpl?: typeof fetch
): Promise<Result<TriageAssessment>> {
	try {
		const data = await createTriageApi(protocol, payload, fetchImpl);
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

export async function getTriage(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<TriageAssessment | null>> {
	try {
		const data = await getTriageApi(protocol, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 404
					? 'Solicitação não encontrada.'
					: error.status === 403
						? 'Você não tem permissão para visualizar a triagem.'
						: 'Não foi possível carregar a triagem.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível carregar a triagem.' } };
	}
}
