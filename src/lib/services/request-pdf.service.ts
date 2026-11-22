import { getInternalRequestPdf, getRequesterRequestPdf } from '$lib/api/request-pdf.api';
import type { FileDownload } from '$lib/types/report';
import type { RequesterIdentity } from '$lib/types/requester-tracking';
import { ApiError, type Result } from '$lib/types/result';

// Mensagens por status HTTP. O 403 fica de fora de propósito: é o backend que
// explica a causa (perfil interno na rota do solicitante, portal em modo
// AUTHENTICATED), então a mensagem dele é repassada.
type StatusMessages = Partial<Record<number, string>>;

function toExportError(error: unknown, messages: StatusMessages): Result<FileDownload> {
	if (error instanceof ApiError) {
		return {
			ok: false,
			error: {
				status: error.status,
				message:
					messages[error.status] ??
					(error.status === 403 ? error.message : 'Não foi possível gerar o PDF da solicitação.')
			}
		};
	}

	return {
		ok: false,
		error: { message: 'Não foi possível conectar ao servidor para gerar o PDF.' }
	};
}

// Exportação pelo acompanhamento: `identity` só é enviada no fluxo público —
// no autenticado o cookie de sessão define a variante do documento.
export async function exportRequesterRequestPdf(
	protocol: string,
	identity: RequesterIdentity | null = null
): Promise<Result<FileDownload>> {
	try {
		return { ok: true, data: await getRequesterRequestPdf(protocol, identity) };
	} catch (error) {
		return toExportError(error, {
			400: 'Não foi possível identificar a solicitação para exportação.',
			401: 'Não foi possível confirmar sua identidade. Valide seus dados novamente para exportar o PDF.',
			404: 'Solicitação não encontrada ou indisponível para exportação.'
		});
	}
}

// Exportação pelo detalhe interno: documento completo, sempre pela sessão.
export async function exportInternalRequestPdf(protocol: string): Promise<Result<FileDownload>> {
	try {
		return { ok: true, data: await getInternalRequestPdf(protocol) };
	} catch (error) {
		return toExportError(error, {
			400: 'Não foi possível identificar a solicitação para exportação.',
			401: 'Sua sessão expirou. Entre novamente para exportar o PDF.',
			403: 'Seu perfil não possui permissão para exportar o PDF interno.',
			404: 'Solicitação não encontrada.'
		});
	}
}
