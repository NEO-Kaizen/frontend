import { getQueueCsv } from '$lib/api/report.api';
import type { QueueFilterQuery } from '$lib/types/queue';
import type { QueueCsvDownload } from '$lib/types/report';
import { ApiError, type Result } from '$lib/types/result';

export async function exportQueueCsv(filters: QueueFilterQuery): Promise<Result<QueueCsvDownload>> {
	try {
		return { ok: true, data: await getQueueCsv(filters) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message:
						error.status === 403
							? 'Seu perfil não possui permissão para exportar a fila.'
							: 'Não foi possível exportar a fila centralizada.'
				}
			};
		}

		return {
			ok: false,
			error: { message: 'Não foi possível conectar ao servidor para gerar o CSV.' }
		};
	}
}
