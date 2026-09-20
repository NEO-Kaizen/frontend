import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { ApiError } from '$lib/types/result';

const PUBLIC_API_URL = env.PUBLIC_API_URL?.replace(/\/$/, '');

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL não está definida no ambiente.');
}

export function resolvePublicApiUrl(path: string): string {
	if (!path.startsWith('/')) {
		throw new Error('O caminho da API deve começar com "/".');
	}

	return `${PUBLIC_API_URL}${path}`;
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

	const response = await doFetch(resolvePublicApiUrl(path), {
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
	if (response.status === 204) {
		return undefined as T;
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
