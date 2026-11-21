import { apiClient, requesterIdentityHeaders } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	PublicRequestDetails,
	PublicVerifyPayload,
	PublicVerifyResult,
	RequesterIdentity,
	RequesterRequestDetails,
	TrackingDetailsResponse
} from '$lib/types/requester-tracking';

const REQUESTS_PATH = '/requests';

function trackingPath(protocol: string, suffix = ''): string {
	return `${REQUESTS_PATH}/${encodeURIComponent(protocol)}${suffix}`;
}

// POST /requests/:protocol/public/verify — validação nome + protocolo + e-mail
// (contrato v0.5 §2.1). NÃO cria JWT/cookie/`requester_access`: em sucesso o
// frontend guarda a identidade em `sessionStorage`
// (`requester-identity.service.ts`) e passa a enviar `X-Requester-Identity`.
export async function verifyPublicAccess(
	payload: PublicVerifyPayload
): Promise<PublicVerifyResult> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { verifyPublicAccessMock } = await import('$lib/mocks/requester-tracking.mock');
		return verifyPublicAccessMock(payload);
	}

	return apiClient<PublicVerifyResult>(trackingPath(payload.protocol, '/public/verify'), {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

// GET /requests/:protocol/tracking — o backend decide o DTO pelo credencial.
// Fluxo público: header `X-Requester-Identity` (protocolo no path). Fluxo
// autenticado: cookie de sessão (`credentials: "include"`, padrão do
// `apiClient`). As duas funções chamam o MESMO endpoint; a separação existe
// para o mock reproduzir a decisão do backend em DEV.
export async function getPublicTracking(
	protocol: string,
	identity: RequesterIdentity,
	fetchImpl?: typeof fetch
): Promise<TrackingDetailsResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getPublicTrackingMock } = await import('$lib/mocks/requester-tracking.mock');
		return getPublicTrackingMock(protocol);
	}

	return apiClient<TrackingDetailsResponse>(
		trackingPath(protocol, '/tracking'),
		{ headers: requesterIdentityHeaders(identity) },
		fetchImpl
	);
}

export async function getSessionTracking(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<TrackingDetailsResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const { getSessionTrackingMock } = await import('$lib/mocks/requester-tracking.mock');
		return getSessionTrackingMock(protocol);
	}

	return apiClient<TrackingDetailsResponse>(trackingPath(protocol, '/tracking'), {}, fetchImpl);
}

export type TrackingDetails = PublicRequestDetails | RequesterRequestDetails;

export function isAuthenticatedDetails(
	response: TrackingDetailsResponse
): response is { mode: 'authenticated'; details: RequesterRequestDetails } {
	return response.mode === 'authenticated';
}
