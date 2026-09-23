import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { CreateTriagePayload, TriageAssessment } from '$lib/types/triage';

const REQUESTS_PATH = '/requests';

export async function createTriage(
	protocol: string,
	payload: CreateTriagePayload,
	fetchImpl?: typeof fetch
): Promise<TriageAssessment> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.triage) {
		const { createTriageMock } = await import('$lib/mocks/triage.mock');
		return createTriageMock(protocol, payload);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<TriageAssessment>(
		`${REQUESTS_PATH}/${encoded}/triage`,
		{
			method: 'POST',
			body: JSON.stringify(payload)
		},
		fetchImpl
	);
}

export async function getTriage(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<TriageAssessment | null> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.triage) {
		const { getTriageMock } = await import('$lib/mocks/triage.mock');
		return getTriageMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<TriageAssessment | null>(
		`${REQUESTS_PATH}/${encoded}/triage`,
		{
			method: 'GET'
		},
		fetchImpl
	);
}
