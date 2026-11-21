import { getDashboard as getDashboardApi } from '$lib/api/dashboard.api';
import type { DashboardQuery, DashboardResponse } from '$lib/types/dashboard';
import { ApiError, type Result } from '$lib/types/result';

export async function loadDashboard(
	query: DashboardQuery,
	fetchImpl?: typeof fetch
): Promise<Result<DashboardResponse>> {
	try {
		return { ok: true, data: await getDashboardApi(query, fetchImpl) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message:
						error.status === 400
							? error.message
							: 'Não foi possível carregar os indicadores do dashboard.'
				}
			};
		}

		return {
			ok: false,
			error: { message: 'Não foi possível conectar ao servidor.' }
		};
	}
}
