import { listProfiles as listProfilesApi } from '$lib/api/profile.api';

import type { Profile } from '$lib/types/profile';
import type { Result } from '$lib/types/result';
import { toApiFailure } from '$lib/utils/api-error';

export async function listProfiles(fetchImpl?: typeof fetch): Promise<Result<Profile[]>> {
	try {
		return { ok: true, data: await listProfilesApi(fetchImpl) };
	} catch (error) {
		return toApiFailure(error);
	}
}

export function requiresProfessionalBlock(profile: Profile): boolean {
	return profile.isAssignableTriage || profile.isAssignableMapping;
}
