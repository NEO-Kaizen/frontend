import { ApiError, type Result } from '$lib/types/result';
import {
	createRequest,
	listRequests as listRequestsApi,
	getRequestByProtocol as getRequestByProtocolApi
} from '$lib/api/request.api';
import type {
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestSummary,
	RequestDetail
} from '$lib/types/request';

import { isProtocol, isValidEmail } from '$lib/utils/validations';

type SearchRequestsResult = Result<PaginatedResponse<RequestSummary>> | Result<RequestDetail>;

// Limites espelhados do contrato — o backend permanece a validação definitiva.
const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
	'image/png',
	'image/jpeg'
];

export async function listRequests(
	query: ListRequestsQuery
): Promise<Result<PaginatedResponse<RequestSummary>>> {
	try {
		const data = await listRequestsApi(query);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: 'Não foi possível carregar as solicitações.' }
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function getRequestByProtocol(protocol: string): Promise<Result<RequestDetail>> {
	try {
		const data = await getRequestByProtocolApi(protocol);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message = error.status === 404 ? 'Solicitação não encontrada.' : error.message;
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

/**
 * Busca uma solicitação pelo protocolo ou pelo e-mail.
 *
 * Se o valor informado for um protocolo, a busca é feita pelo protocolo.
 * Caso contrário, a busca é feita pelo e-mail.
 */
export async function searchRequests(value: string): Promise<SearchRequestsResult> {
	const normalizedValue = value.trim();

	if (!normalizedValue) {
		return {
			ok: false,
			error: {
				message: 'Informe um protocolo ou e-mail.'
			}
		};
	}

	if (isProtocol(normalizedValue)) {
		return getRequestByProtocol(normalizedValue);
	}

	if (isValidEmail(normalizedValue)) {
		return listRequests({
			email: normalizedValue
		});
	}

	return {
		ok: false,
		error: {
			message: 'Informe um protocolo ou e-mail válido.'
		}
	};
}

export async function submitDemand(
	payload: CreateRequestPayload,
	files: File[] = []
): Promise<Result<CreateRequestResponse>> {
	const validation = validateFiles(files);
	if (validation) {
		return { ok: false, error: validation };
	}

	try {
		const data = await createRequest(payload, files);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: { status: error.status, message: error.message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

function validateFiles(files: File[]): { message: string } | null {
	if (files.length > MAX_FILES) {
		return { message: `Envie no máximo ${MAX_FILES} anexos.` };
	}

	for (const file of files) {
		if (file.size > MAX_FILE_SIZE_BYTES) {
			return { message: `O arquivo "${file.name}" excede 10MB.` };
		}
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return {
				message: `Formato não permitido: "${file.name}". Use PDF, DOCX, XLSX, PNG ou JPG.`
			};
		}
	}

	return null;
}
