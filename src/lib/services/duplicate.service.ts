import { checkDuplicates } from '$lib/api/duplicate.api';
import type { DuplicateCheckResponse } from '$lib/types/duplicate';
import type { DemandBlock } from '$lib/types/request';
import { ApiError, type Result } from '$lib/types/result';

const DUPLICATE_CHECK_ERROR = 'Não foi possível verificar solicitações semelhantes.';

// O RF16 apenas alerta: falha na consulta nunca bloqueia o avanço da aba de
// Demanda. O chamador trata qualquer resultado de erro como ausência de alerta.
export async function checkDemandDuplicates(
	demand: DemandBlock
): Promise<Result<DuplicateCheckResponse>> {
	try {
		return { ok: true, data: await checkDuplicates(demand) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: DUPLICATE_CHECK_ERROR }
			};
		}

		return { ok: false, error: { message: DUPLICATE_CHECK_ERROR } };
	}
}
