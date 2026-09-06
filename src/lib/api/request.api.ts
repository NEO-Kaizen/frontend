import { ApiError, apiClient } from './client';
import { env } from '$env/dynamic/public';
import { listRequestsMock, getRequestByProtocolMock } from '$lib/mocks/requests.mock';
import type {
	ApiErrorResponse,
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestSummary,
	RequestDetail
} from '$lib/types/request';

// TODO (melhoria futura): centralizar a leitura de envs em um módulo de
// configuração — hoje client.ts duplica esta verificação.
const PUBLIC_API_URL = env.PUBLIC_API_URL;

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL não está definida no ambiente.');
}

const REQUESTS_PATH = '/requests';

// TODO: Substituir o mock pela integração com a API quando o backend estiver disponível.
const USE_MOCK = true;

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

export function listRequests(query: ListRequestsQuery): Promise<PaginatedResponse<RequestSummary>> {
	if (USE_MOCK) {
		return listRequestsMock(query);
	}

	const params = new URLSearchParams();

	params.set('email', query.email);

	if (query.search) params.set('search', query.search);
	if (query.status) params.set('status', query.status);
	if (query.page !== undefined) params.set('page', String(query.page));
	if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));

	const qs = params.toString();
	const path = qs ? `${REQUESTS_PATH}?${qs}` : REQUESTS_PATH;

	return apiClient<PaginatedResponse<RequestSummary>>(path);
}

export function getRequestByProtocol(protocol: string): Promise<RequestDetail> {
	if (USE_MOCK) {
		return getRequestByProtocolMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<RequestDetail>(`${REQUESTS_PATH}/${encoded}`);
}
