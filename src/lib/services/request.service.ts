import {
	createRequest,
	getQueueMetrics as getQueueMetricsApi,
	getRequestByProtocol as getRequestByProtocolApi,
	getInternalRequest as getInternalRequestApi,
	listQueueRequests as listQueueRequestsApi,
	listRequests as listRequestsApi,
	updateInternalRequest as updateInternalRequestApi
} from '$lib/api/request.api';

import type { QueueMetricsResponse, QueueQuery, QueueResponse } from '$lib/types/queue';
import type {
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestSummary,
	InternalRequestDetail,
	UpdateInternalRequestPayload
} from '$lib/types/request';
import { ApiError, type Result } from '$lib/types/result';

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
	query: ListRequestsQuery,
	fetchImpl?: typeof fetch
): Promise<Result<PaginatedResponse<RequestSummary>>> {
	try {
		const data = await listRequestsApi(query, fetchImpl);

		return {
			ok: true,
			data
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: 'Não foi possível carregar as solicitações.'
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
}

export async function listQueueRequests(
	query: QueueQuery,
	fetchImpl?: typeof fetch
): Promise<Result<QueueResponse>> {
	try {
		const data = await listQueueRequestsApi(query, fetchImpl);

		return {
			ok: true,
			data
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: 'Não foi possível carregar a fila centralizada.'
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
}

export async function getQueueMetrics(
	fetchImpl?: typeof fetch
): Promise<Result<QueueMetricsResponse>> {
	try {
		const data = await getQueueMetricsApi(fetchImpl);

		return {
			ok: true,
			data
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: 'Não foi possível carregar as métricas da fila.'
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
}

export async function getRequestByProtocol(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<RequestDetail>> {
	try {
		const data = await getRequestByProtocolApi(protocol, fetchImpl);

		return {
			ok: true,
			data
		};
	} catch (error) {
		if (error instanceof ApiError) {
			const message = error.status === 404 ? 'Solicitação não encontrada.' : error.message;

			return {
				ok: false,
				error: {
					status: error.status,
					message
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
}

export async function getInternalRequest(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<InternalRequestDetail>> {
	try {
		const data = await getInternalRequestApi(protocol, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message = error.status === 404 ? 'Solicitação não encontrada.' : error.message;
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function updateInternalRequest(
	protocol: string,
	payload: UpdateInternalRequestPayload,
	fetchImpl?: typeof fetch
): Promise<Result<InternalRequestDetail>> {
	try {
		const data = await updateInternalRequestApi(protocol, payload, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 404
					? 'Solicitação não encontrada.'
					: error.status === 403
						? 'Você não tem permissão para editar esta solicitação.'
						: 'Não foi possível salvar as alterações.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível salvar as alterações.' } };
	}
}

/**
 * Busca uma solicitação pelo protocolo ou pelo e-mail.
 *
 * Se o valor informado for um protocolo, a busca é feita pelo protocolo.
 * Caso contrário, a busca é feita pelo e-mail.
 *
 * O protocolo é validado apenas pela estrutura (prefixo + blocos), sem
 * restringir ao `protocolMask` configurado.
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
		return {
			ok: false,
			error: validation
		};
	}

	try {
		const data = await createRequest(payload, files);

		return {
			ok: true,
			data
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
				message: 'Não foi possível conectar ao servidor.'
			}
		};
	}
}

function validateFiles(files: File[]): { message: string } | null {
	if (files.length > MAX_FILES) {
		return {
			message: `Envie no máximo ${MAX_FILES} anexos.`
		};
	}

	for (const file of files) {
		if (file.size > MAX_FILE_SIZE_BYTES) {
			return {
				message: `O arquivo "${file.name}" excede 10MB.`
			};
		}

		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return {
				message: `Formato não permitido: "${file.name}". Use PDF, DOCX, XLSX, PNG ou JPG.`
			};
		}
	}

	return null;
}
