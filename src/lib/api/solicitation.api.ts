import { ApiError } from './client';
import { env } from '$env/dynamic/public';
import type {
	ApiErrorResponse,
	CreateRequestPayload,
	CreateRequestResponse
} from '$lib/types/solicitation';

const PUBLIC_API_URL = env.PUBLIC_API_URL;

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL não está definida no ambiente.');
}

const REQUESTS_PATH = '/requests';

// Função auxiliar para requests multipart/form-data. O apiClient genérico
// força `Content-Type: application/json`, o que impede o upload de arquivos.
// Mantida neste módulo para não impactar endpoints JSON existentes; extrair
// para client.ts quando houver mais endpoints multipart.
async function multipartClient<T>(path: string, formData: FormData): Promise<T> {
	const response = await fetch(`${PUBLIC_API_URL}${path}`, {
		method: 'POST',
		credentials: 'include',
		body: formData
		// Sem Content-Type — o browser gera o boundary multipart automaticamente.
	});

	if (!response.ok) {
		let message = 'Request failed';
		try {
			const body = (await response.json()) as Partial<ApiErrorResponse>;
			message = body.message ?? message;
		} catch {
			// resposta não-JSON; mantém a mensagem padrão
		}
		throw new ApiError(response.status, message);
	}

	return (await response.json()) as T;
}

// POST /requests — envia o formulário (parte textual "payload") e os anexos
// (0 a 5 partes binárias "attachments") num único multipart/form-data.
export async function createRequest(
	payload: CreateRequestPayload,
	files: Blob[] = []
): Promise<CreateRequestResponse> {
	const formData = new FormData();
	formData.append('payload', JSON.stringify(payload));

	for (const file of files) {
		formData.append('attachments', file);
	}

	return multipartClient<CreateRequestResponse>(REQUESTS_PATH, formData);
}
