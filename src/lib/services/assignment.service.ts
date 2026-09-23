import { assignAnalyst as assignAnalystApi } from '$lib/api/request.api';
import { listAnalysts as listAnalystsApi } from '$lib/api/user.api';
import type { InternalRequestDetail } from '$lib/types/request';
import { ApiError, type Result } from '$lib/types/result';
import type { Analyst } from '$lib/types/user';
import { isValidDate } from '$lib/utils/validations';

function todayIsoDate(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export async function listAnalysts(fetchImpl?: typeof fetch): Promise<Result<Analyst[]>> {
	try {
		const response = await listAnalystsApi(fetchImpl);
		return {
			ok: true,
			data: response
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}
		return {
			ok: false,
			error: {
				message: 'Não foi possível carregar os analistas.'
			}
		};
	}
}

export type AssignResponsibility = 'triagem' | 'mapeamento';

export async function assignAnalyst(
	protocol: string,
	analystId: string,
	responsibility: AssignResponsibility = 'triagem',
	assigneeDeadline: string | null = null,
	fetchImpl?: typeof fetch
): Promise<Result<InternalRequestDetail>> {
	if (!analystId || !analystId.trim()) {
		return {
			ok: false,
			error: {
				message: 'Selecione um analista.'
			}
		};
	}

	if (responsibility !== 'triagem' && responsibility !== 'mapeamento') {
		return {
			ok: false,
			error: {
				message: 'Selecione a responsabilidade (Triagem ou Mapeamento).'
			}
		};
	}

	if (assigneeDeadline !== null && assigneeDeadline !== '') {
		if (!isValidDate(assigneeDeadline) || assigneeDeadline < todayIsoDate()) {
			return {
				ok: false,
				error: {
					message: 'O prazo não pode ser anterior a hoje.'
				}
			};
		}
	}

	try {
		const data = await assignAnalystApi(
			protocol,
			analystId,
			responsibility,
			assigneeDeadline,
			fetchImpl
		);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 404
					? error.message
					: error.status === 403
						? 'Você não tem permissão para atribuir um analista.'
						: error.message || 'Não foi possível atribuir o analista.';
			return { ok: false, error: { status: error.status, message } };
		}
		return {
			ok: false,
			error: {
				message: 'Não foi possível conectar ao servidor.'
			}
		};
	}
}
