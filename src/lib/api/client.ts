import { env } from '$env/dynamic/public';
import { ApiError } from '$lib/types/result';

const PUBLIC_API_URL = env.PUBLIC_API_URL;

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL não está definida no ambiente.');
}

// FormData sem Content-Type: o browser gera o boundary do multipart.
export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
	const isMultipart = options.body instanceof FormData;

	const response = await fetch(`${PUBLIC_API_URL}${path}`, {
		credentials: 'include',
		...options,
		headers: {
			...(isMultipart ? undefined : { 'Content-Type': 'application/json' }),
			...options.headers
		}
	});

	if (!response.ok) {
		throw new ApiError(response.status, await readErrorMessage(response));
	}

	return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as { message?: string; error?: string };
		return body.message || body.error || 'Não foi possível concluir a operação.';
	} catch {
		return 'Não foi possível concluir a operação.';
	}
}
