import { MOCK_DOMAINS } from '$lib/mocks';
import type { FileDownload } from '$lib/types/report';
import type { RequesterIdentity } from '$lib/types/requester-tracking';
import { apiFetch, requesterIdentityHeaders } from './client';

// Rotas do contrato de exportação em PDF (Issue #149), relativas a
// `PUBLIC_API_URL`. A variante do documento é decidida pelo backend pela
// credencial enviada — o front nunca escolhe o recorte.

// PDF do solicitante (autenticado ou público): mesma rota, o `requesterDualAuth`
// do backend resolve o fluxo pelo cookie ou pelo header de identidade.
const REQUESTER_PDF_PATH = (protocol: string) =>
	`/reports/request/protocol/${encodeURIComponent(protocol)}/pdf`;

const INTERNAL_PDF_PATH = (protocol: string) =>
	`/reports/request/internal/${encodeURIComponent(protocol)}/pdf`;

const fallbackFilename = (protocol: string) => `relatorio-solicitacao-${protocol}.pdf`;

// O `Content-Disposition` só é legível se o backend expuser o header via CORS;
// quando não vier, o fallback usa o protocolo (que já identifica o documento).
function readFilename(response: Response, fallback: string): string {
	const disposition = response.headers.get('content-disposition');
	const match = disposition?.match(/filename="([^"]+)"/i);
	return match?.[1] ?? fallback;
}

export async function getRequesterRequestPdf(
	protocol: string,
	identity: RequesterIdentity | null = null
): Promise<FileDownload> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.reports) {
		const { requestPdfMock } = await import('$lib/mocks/request-pdf.mock');
		return requestPdfMock({ protocol, mode: identity ? 'public' : 'authenticated' });
	}

	const response = await apiFetch(REQUESTER_PDF_PATH(protocol), {
		headers: requesterIdentityHeaders(identity)
	});

	return {
		blob: await response.blob(),
		filename: readFilename(response, fallbackFilename(protocol))
	};
}

export async function getInternalRequestPdf(protocol: string): Promise<FileDownload> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.reports) {
		const { requestPdfMock } = await import('$lib/mocks/request-pdf.mock');
		return requestPdfMock({ protocol, mode: 'internal' });
	}

	const response = await apiFetch(INTERNAL_PDF_PATH(protocol));

	return {
		blob: await response.blob(),
		filename: readFilename(response, fallbackFilename(protocol))
	};
}
