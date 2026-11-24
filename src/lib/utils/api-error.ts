import { ApiError, type Result } from '$lib/types/result';

export function mapApiError<T>(error: unknown): Result<T> {
	if (error instanceof ApiError) {
		return {
			ok: false,
			error: {
				status: error.status,
				message: error.status >= 500 ? 'Ocorreu um erro interno. Tente novamente.' : error.message
			}
		};
	}

	return {
		ok: false,
		error: {
			message: 'Não foi possível conectar ao servidor.'
		}
	};
}
