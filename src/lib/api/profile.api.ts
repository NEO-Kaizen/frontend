import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';

import type { Profile } from '$lib/types/profile';

export async function listProfiles(fetchImpl?: typeof fetch): Promise<Profile[]> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.profiles) {
		const { listProfilesMock } = await import('$lib/mocks/profiles.mock');
		return listProfilesMock();
	}

	return apiClient<Profile[]>('/profiles', {}, fetchImpl);
}
