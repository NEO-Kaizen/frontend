import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';

// Contrato RF13 (rf13-status-time-audit.md §1 e §3). Respostas cruas — a
// validação do payload fica no service.

const AUDIT_LOGS_PATH = '/audit-logs';

function protocolPath(protocol: string): string {
	return `${AUDIT_LOGS_PATH}/${encodeURIComponent(protocol)}`;
}

export async function getStatusTimes(protocol: string, fetchImpl?: typeof fetch): Promise<unknown> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.statusTimes) {
		const { getStatusTimesMock } = await import('$lib/mocks/status-time.mock');
		return getStatusTimesMock(protocol);
	}

	return apiClient<unknown>(`${protocolPath(protocol)}/status-times`, {}, fetchImpl);
}

export async function getRequestAuditLogs(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<unknown> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.statusTimes) {
		const { getRequestAuditLogsMock } = await import('$lib/mocks/status-time.mock');
		return getRequestAuditLogsMock(protocol);
	}

	return apiClient<unknown>(protocolPath(protocol), {}, fetchImpl);
}
