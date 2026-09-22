import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { ApiError } from '$lib/types/result';

const PUBLIC_API_URL = env.PUBLIC_API_URL;

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL não está definida no ambiente.');
}

// No servidor, o fetch global não carrega o cookie da página: o fetch
// credentialed é o fornecido ao `load` (event.fetch). Se um caminho de SSR
// esquecer de repassá-lo, falha explicitamente em vez de perder a sessão.
function resolveFetch(fetchImpl?: typeof fetch): typeof fetch {
	if (fetchImpl) return fetchImpl;
	if (browser) return fetch;

	const error = new Error(
		'apiClient no servidor requer o fetch do load (event.fetch). ' +
			'Repasse o fetch do load pela cadeia service → api.'
	);

	// Os services capturam o erro e devolvem mensagem amigável; o log garante
	// que a causa (fetch esquecido em um load) não passe despercebida em dev.
	console.error(error);

	throw error;
}

// FormData sem Content-Type: o browser gera o boundary do multipart.
export async function apiClient<T>(
	path: string,
	options: RequestInit = {},
	fetchImpl?: typeof fetch
): Promise<T> {
	const doFetch = resolveFetch(fetchImpl);
	const isMultipart = options.body instanceof FormData;

	const response = await doFetch(`${PUBLIC_API_URL}${path}`, {
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

	return readSuccessBody<T>(response);
}

async function readSuccessBody<T>(response: Response): Promise<T> {
	if (response.status === 204 || response.headers.get('content-length') === '0') {
		return undefined as T;
	}

	const contentType = response.headers.get('content-type');

	if (!contentType?.includes('application/json')) {
		return undefined as T;
	}

	const text = await response.text();

	if (!text.trim()) {
		return undefined as T;
	}

	try {
		return JSON.parse(text) as T;
	} catch {
		return undefined as T;
	}
}

async function readErrorMessage(response: Response): Promise<string> {
	const fallback = 'Não foi possível concluir a operação.';

	try {
		const body: unknown = await response.json();

		if (typeof body !== 'object' || body === null) {
			return fallback;
		}

		if ('message' in body && typeof body.message === 'string' && body.message.trim()) {
			return body.message;
		}

		if ('error' in body && typeof body.error === 'string' && body.error.trim()) {
			return body.error;
		}

		return fallback;
	} catch {
		return fallback;
	}
}
