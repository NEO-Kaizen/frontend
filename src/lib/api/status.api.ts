import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { UpdateStatusRequest, UpdateStatusResponse } from '$lib/types/request';

const REQUESTS_PATH = '/requests';

// PATCH /requests/:protocol/status — v4 único (free operacional + ADMIN bypass)
// body: { targetStatus: number, justification: string 1..4000 }
export async function updateRequestStatus(
	protocol: string,
	payload: UpdateStatusRequest,
	fetchImpl?: typeof fetch
): Promise<UpdateStatusResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.request) {
		const mod = (await import('$lib/mocks/requests.mock')) as Record<string, unknown>;
		if (typeof mod.updateRequestStatusMock === 'function') {
			return (mod.updateRequestStatusMock as typeof updateRequestStatus)(
				protocol,
				payload,
				fetchImpl
			);
		}
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<UpdateStatusResponse>(
		`${REQUESTS_PATH}/${encoded}/status`,
		{
			method: 'PATCH',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}
