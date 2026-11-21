import {
	getPublicTracking as getPublicTrackingApi,
	getSessionTracking as getSessionTrackingApi,
	verifyPublicAccess as verifyPublicAccessApi
} from '$lib/api/requester-tracking.api';
import { getPendingItems as getPendingItemsApi } from '$lib/api/pending-item.api';

export { isAuthenticatedDetails } from '$lib/api/requester-tracking.api';
import type { ListPendenciesResponse } from '$lib/types/pendency';
import type {
	PublicVerifyPayload,
	PublicVerifyResult,
	RequesterIdentity,
	TrackingDetailsResponse
} from '$lib/types/requester-tracking';
import { ApiError, type Result } from '$lib/types/result';
import { isValidEmail } from '$lib/utils/validations';

// Service do SOLICITANTE: leitura (tracking, pendências) com dois transportes
// (contrato v0.5 §2) — público via `X-Requester-Identity` (a identidade vive em
// `requester-identity.service.ts`, só na página) e autenticado via sessão. A
// escrita (resposta/anexo por item) está em `pendency.service.ts`
// (`respondPendingItemAsRequester`, `uploadPendingItemAttachmentAsRequester`).
// Não há chat/mensagens: a única via de resposta é o PATCH por item.
export function validateVerifyPayload(payload: PublicVerifyPayload): string | null {
	if (!payload.name.trim()) return 'Informe seu nome completo.';
	if (!isValidEmail(payload.email.trim())) return 'Informe um e-mail válido.';
	if (!payload.protocol.trim()) return 'Informe o protocolo.';
	return null;
}

function toResult<T>(promise: Promise<T>, fallback: string): Promise<Result<T>>;
function toResult<T>(
	promise: Promise<T>,
	fallback: (status?: number) => string
): Promise<Result<T>>;
async function toResult<T>(
	promise: Promise<T>,
	fallback: string | ((status?: number) => string)
): Promise<Result<T>> {
	try {
		return { ok: true, data: await promise };
	} catch (error) {
		if (error instanceof ApiError) {
			const message = typeof fallback === 'function' ? fallback(error.status) : fallback;
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export function verifyPublicAccess(
	payload: PublicVerifyPayload
): Promise<Result<PublicVerifyResult>> {
	const validationError = validateVerifyPayload(payload);
	if (validationError) return Promise.resolve({ ok: false, error: { message: validationError } });

	return toResult(
		verifyPublicAccessApi({
			name: payload.name.trim(),
			email: payload.email.trim(),
			protocol: payload.protocol.trim()
		}),
		(status) => {
			if (status === 429) {
				return 'Muitas tentativas de validação. Aguarde alguns minutos antes de tentar novamente.';
			}
			if (status === 403) {
				return 'A consulta pública não está habilitada neste portal.';
			}
			return 'Dados de validação inválidos. Confira nome, e-mail e protocolo.';
		}
	);
}

export function getPublicTracking(
	protocol: string,
	identity: RequesterIdentity,
	fetchImpl?: typeof fetch
): Promise<Result<TrackingDetailsResponse>> {
	return toResult(getPublicTrackingApi(protocol, identity, fetchImpl), (status) =>
		status === 401
			? 'Autorização expirada. Valide seus dados novamente.'
			: 'Não foi possível carregar a solicitação.'
	);
}

export function getSessionTracking(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<TrackingDetailsResponse>> {
	return toResult(getSessionTrackingApi(protocol, fetchImpl), (status) => {
		if (status === 404) return 'Solicitação não encontrada.';
		if (status === 403) return 'Você não tem permissão para acompanhar esta solicitação.';
		return 'Não foi possível carregar a solicitação.';
	});
}

// GET /requests/:protocol/pending-items (contrato v0.5 §7): envelope
// `ListPendingItemsResponse` (`batchId` + `requestAttachment` do lote vigente +
// `items`); o front agrupa por `batchId` (`toPendingBatches` em
// `pendency.service.ts`) e usa `requestAttachment` como única fonte de verdade
// para exibir o upload.
export function getPendingItems(
	protocol: string,
	identity?: RequesterIdentity | null,
	fetchImpl?: typeof fetch
): Promise<Result<ListPendenciesResponse>> {
	return toResult(
		getPendingItemsApi(protocol, identity, fetchImpl),
		'Não foi possível carregar as pendências.'
	);
}
