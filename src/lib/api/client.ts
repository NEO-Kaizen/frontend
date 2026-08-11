import { env } from '$env/dynamic/public';

const PUBLIC_API_URL = env.PUBLIC_API_URL;

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL não está definida no ambiente.');
}

export class ApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${PUBLIC_API_URL}${path}`, {
		credentials: 'include',
		...options,
		headers: {
			'Content-Type': 'application/json',
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
		return body.message ?? body.error ?? 'Request failed';
	} catch {
		return 'Request failed';
	}
}
