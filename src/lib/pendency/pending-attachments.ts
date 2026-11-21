import {
	ALLOWED_FILE_EXTENSIONS,
	ALLOWED_FILE_TYPES,
	MAX_FILE_SIZE,
	MAX_PENDING_ATTACHMENTS_PER_BATCH
} from '$lib/types/request';

// Regras de anexo do solicitante por pendência/lote (contrato de pendências):
// no máximo 3 arquivos por lote, 10 MB por arquivo, tipos
// PDF/DOCX/XLSX/PNG/JPG-JPEG, sem duplicados (`name + size + type`).
// A validação roda no frontend ANTES do upload — nada inválido chega ao
// `POST .../pending-items/:pendingItemId/attachments`.
export const MAX_ATTACHMENTS = MAX_PENDING_ATTACHMENTS_PER_BATCH;
export const MAX_ATTACHMENT_SIZE = MAX_FILE_SIZE;
export const ACCEPTED_FILE_TYPES: readonly string[] = ALLOWED_FILE_TYPES;
export const ACCEPTED_FILE_EXTENSIONS: readonly string[] = ALLOWED_FILE_EXTENSIONS;

/** Extensão em minúsculas com ponto (ex.: `.pdf`); `''` quando sem extensão. */
export function getFileExtension(fileName: string): string {
	const trimmed = fileName.trim().toLowerCase();
	const dot = trimmed.lastIndexOf('.');
	if (dot < 0 || dot === trimmed.length - 1) return '';
	return trimmed.slice(dot);
}

/**
 * Tipo permitido: aceita pelo MIME ou, quando o browser informa `type` vazio
 * ou genérico, pela extensão. `.jpg`/`.jpeg` valem para `image/jpeg`.
 */
export function isAllowedAttachmentType(fileName: string, mimeType: string): boolean {
	const extension = getFileExtension(fileName);
	const extensionValid = (ACCEPTED_FILE_EXTENSIONS as readonly string[]).includes(extension);
	if (!mimeType) return extensionValid;
	const typeValid = (ACCEPTED_FILE_TYPES as readonly string[]).includes(mimeType);
	// MIME conhecido porém extensão fora da lista (ex.: `.exe` com MIME
	// forjado) continua rejeitado; MIME vazio cai no fallback da extensão.
	if (!extensionValid) return false;
	return typeValid || mimeType === '' || mimeType === 'application/octet-stream';
}

export function attachmentKey(fileName: string, sizeBytes: number, mimeType: string): string {
	return `${fileName.trim().toLowerCase()}|${sizeBytes}|${(mimeType ?? '').toLowerCase()}`;
}

export function attachmentKeyOfFile(file: File): string {
	return attachmentKey(file.name, file.size, file.type);
}

export interface PendingAttachmentMeta {
	fileName: string;
	sizeBytes: number;
	mimeType: string;
}

export function attachmentKeyOfMeta(meta: PendingAttachmentMeta): string {
	return attachmentKey(meta.fileName, meta.sizeBytes, meta.mimeType);
}

export interface AttachmentValidationContext {
	sentAttachments?: readonly PendingAttachmentMeta[];
	selectedKeys?: ReadonlySet<string>;
	occupiedCount?: number;
}

export function validatePendingAttachmentFile(
	file: File,
	context: AttachmentValidationContext = {}
): string | null {
	if (!file || file.size <= 0) return 'Selecione um arquivo para enviar.';

	if (!isAllowedAttachmentType(file.name, file.type)) {
		return 'Tipo de arquivo não permitido. Use PDF, DOCX, XLSX, PNG ou JPG.';
	}

	if (file.size > MAX_ATTACHMENT_SIZE) {
		return `“${file.name}” excede o tamanho máximo de 10 MB.`;
	}

	const key = attachmentKeyOfFile(file);
	const sentKeys = new Set(
		(context.sentAttachments ?? []).map((meta) => attachmentKeyOfMeta(meta))
	);
	if (sentKeys.has(key) || context.selectedKeys?.has(key)) {
		return `“${file.name}” já foi adicionado a esta pendência.`;
	}

	const occupied = context.occupiedCount ?? sentKeys.size + (context.selectedKeys?.size ?? 0);
	if (occupied >= MAX_ATTACHMENTS) {
		return `Limite de ${MAX_ATTACHMENTS} anexos por pendência atingido.`;
	}

	return null;
}

export interface PendingAttachmentBatchResult {
	valid: File[];
	rejected: { file: File; message: string }[];
}

export function validatePendingAttachmentBatch(
	files: readonly File[],
	context: Omit<AttachmentValidationContext, 'selectedKeys' | 'occupiedCount'> & {
		alreadySelected?: readonly File[];
	} = {}
): PendingAttachmentBatchResult {
	const selectedKeys = new Set((context.alreadySelected ?? []).map(attachmentKeyOfFile));
	const sentAttachments = context.sentAttachments ?? [];
	let occupied = sentAttachments.length + selectedKeys.size;

	const valid: File[] = [];
	const rejected: { file: File; message: string }[] = [];

	for (const file of files) {
		const error = validatePendingAttachmentFile(file, {
			sentAttachments,
			selectedKeys,
			occupiedCount: occupied
		});
		if (error) {
			rejected.push({ file, message: error });
			continue;
		}
		valid.push(file);
		selectedKeys.add(attachmentKeyOfFile(file));
		occupied += 1;
	}

	return { valid, rejected };
}
