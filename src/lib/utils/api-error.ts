import { ApiError, type Result } from '$lib/types/result';

export function isRetryableApiStatus(status: number): boolean {
	return status === 429 || status >= 500;
}

export function toApiFailure<T>(error: unknown): Result<T> {
	if (error instanceof ApiError) {
		return {
			ok: false,
			error: {
				status: error.status,
				retryable: isRetryableApiStatus(error.status),
				message: error.message
			}
		};
	}

	return {
		ok: false,
		error: {
			retryable: true,
			message: 'Não foi possível conectar ao servidor.'
		}
	};
}
