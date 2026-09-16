import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { InternalRequestDetail } from '$lib/types/request';
import type { TriageAssessment } from '$lib/types/triage';

const REQUESTS_PATH = '/requests';

export async function updateTriage(
	protocol: string,
	payload: TriageAssessment,
	fetchImpl?: typeof fetch
): Promise<InternalRequestDetail> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.triage) {
		const { updateTriageMock } = await import('$lib/mocks/triage.mock');
		return updateTriageMock(protocol, payload);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<InternalRequestDetail>(
		`${REQUESTS_PATH}/${encoded}/triage`,
		{
			method: 'PATCH',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}
