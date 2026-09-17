import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	CreateInternalObservationPayload,
	InternalObservation,
	InternalObservationsData
} from '$lib/types/internal-observation';

const REQUESTS_PATH = '/requests';

function internalObservationsPath(protocol: string): string {
	const encoded = encodeURIComponent(protocol);
	return `${REQUESTS_PATH}/${encoded}/internal-observations`;
}

export async function getInternalObservations(protocol: string): Promise<InternalObservationsData> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.internalObservations) {
		const { getInternalObservationsMock } = await import('$lib/mocks/internal-observations.mock');

		return getInternalObservationsMock(protocol);
	}

	return apiClient<InternalObservationsData>(internalObservationsPath(protocol));
}

export async function createInternalObservation(
	protocol: string,
	payload: CreateInternalObservationPayload
): Promise<InternalObservation> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.internalObservations) {
		const { createInternalObservationMock } = await import('$lib/mocks/internal-observations.mock');

		return createInternalObservationMock(protocol, payload);
	}

	return apiClient<InternalObservation>(internalObservationsPath(protocol), {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}
