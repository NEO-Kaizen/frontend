import { assignAnalyst as assignAnalystApi } from '$lib/api/request.api';
import { listUsers as listUsersApi } from '$lib/api/user.api';
import type { InternalRequestDetail, PaginatedResponse } from '$lib/types/request';
import { ApiError, type Result } from '$lib/types/result';
import type { Analyst, ListUsersQuery } from '$lib/types/user';

export async function listAnalysts(
	query: Omit<ListUsersQuery, 'profile'> & { profile?: ListUsersQuery['profile'] },
	fetchImpl?: typeof fetch
): Promise<Result<PaginatedResponse<Analyst>>> {
	try {
		const response = await listUsersApi(
			{ ...query, profile: 'analista' } as ListUsersQuery,
			fetchImpl
		);
		return {
			ok: true,
			data: response as unknown as PaginatedResponse<Analyst>
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

export async function assignAnalyst(
	protocol: string,
	analystId: string,
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

	try {
		const data = await assignAnalystApi(protocol, analystId, fetchImpl);
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
