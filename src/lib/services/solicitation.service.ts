import { ApiError } from '$lib/api/client';
import { createRequest } from '$lib/api/solicitation.api';
import type { CreateRequestPayload, CreateRequestResponse } from '$lib/types/solicitation';

type SubmitDemandResult =
	| { ok: true; data: CreateRequestResponse }
	| { ok: false; error: { status?: number; message: string } };

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

export async function submitDemand(
	payload: CreateRequestPayload,
	files: File[] = []
): Promise<SubmitDemandResult> {
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
