import { apiFetch } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { QueueFilterQuery } from '$lib/types/queue';
import type { QueueCsvDownload } from '$lib/types/report';

const QUEUE_EXPORT_PATH = '/reports/requests.csv';
const FALLBACK_FILENAME = 'solicitacoes.csv';

function buildQuery(filters: QueueFilterQuery): string {
	const params = new URLSearchParams();

	if (filters.search) params.set('search', filters.search);
	if (filters.status) params.set('status', filters.status);
	if (filters.priority) params.set('priority', filters.priority);
	if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);

	const query = params.toString();
	return query ? `${QUEUE_EXPORT_PATH}?${query}` : QUEUE_EXPORT_PATH;
}

function readFilename(response: Response): string {
	const disposition = response.headers.get('content-disposition');
	const match = disposition?.match(/filename="([^"]+)"/i);
	return match?.[1] ?? FALLBACK_FILENAME;
}

export async function getQueueCsv(filters: QueueFilterQuery): Promise<QueueCsvDownload> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.reports) {
		const { exportQueueCsvMock } = await import('$lib/mocks/reports.mock');
		return exportQueueCsvMock(filters);
	}

	const response = await apiFetch(buildQuery(filters));

	return {
		blob: await response.blob(),
		filename: readFilename(response)
	};
}
