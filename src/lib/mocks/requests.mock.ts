import { ApiError } from '$lib/types/result';
import type {
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestSummary
} from '$lib/types/request';

import { mockRequests, mockRequestDetails } from './requests';

// Limites espelhados do contrato — o mock simula a validação do backend.
const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
	'image/png',
	'image/jpeg'
];

export function createRequestMock(
	payload: CreateRequestPayload,
	files: Blob[] = []
): Promise<CreateRequestResponse> {
	const rejection = validateAttachments(files);
	if (rejection) {
		return Promise.reject(new ApiError(400, rejection));
	}

	return Promise.resolve({
		protocol: generateMockProtocol(),
		status: 'Solicitação enviada',
		createdAt: new Date().toISOString()
	});
}

function validateAttachments(files: Blob[]): string | null {
	if (files.length > MAX_FILES) {
		return `Envie no máximo ${MAX_FILES} anexos.`;
	}

	for (const file of files) {
		const name = file instanceof File ? file.name : 'anexo';
		if (file.size > MAX_FILE_SIZE_BYTES) {
			return `O arquivo "${name}" excede 10MB.`;
		}
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return `Formato não permitido: "${name}". Use PDF, DOCX, XLSX, PNG ou JPG.`;
		}
	}

	return null;
}

const PROTOCOL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Protocolo fictício no formato do contrato (geração FPE/Feistel é do backend).
function generateMockProtocol(): string {
	const pick = () =>
		Array.from(
			{ length: 4 },
			() => PROTOCOL_ALPHABET[Math.floor(Math.random() * PROTOCOL_ALPHABET.length)]
		).join('');
	return `MAAT-${pick()}-${pick()}`;
}

export function listRequestsMock(
	query: ListRequestsQuery
): Promise<PaginatedResponse<RequestSummary>> {
	let requests = [...mockRequests];

	if (query.email) {
		const email = query.email.toLowerCase().trim();

		requests = requests.filter((r) => r.corporateEmail.toLowerCase().trim() === email);
	}

	if (query.search) {
		const search = query.search.toLowerCase().trim();

		requests = requests.filter(
			(r) =>
				r.processName.toLowerCase().includes(search) ||
				r.requesterName.toLowerCase().includes(search) ||
				r.corporateEmail.toLowerCase().includes(search)
		);
	}

	if (query.status) {
		requests = requests.filter((r) => r.status === query.status);
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 10;
	const total = requests.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;
	const data = requests.slice(start, start + pageSize);

	return Promise.resolve({
		data,
		page,
		pageSize,
		total,
		totalPages
	});
}

export function getRequestByProtocolMock(protocol: string): Promise<RequestDetail> {
	const normalized = protocol.toLowerCase().trim();

	const detail = mockRequestDetails.find((d) => d.protocol.toLowerCase().trim() === normalized);

	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}

	return Promise.resolve(detail);
}
