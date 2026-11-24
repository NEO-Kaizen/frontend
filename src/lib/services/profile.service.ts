import { listProfiles as listProfilesApi } from '$lib/api/profile.api';

import type { Profile } from '$lib/types/profile';
import { ApiError, type Result } from '$lib/types/result';

export async function listProfiles(fetchImpl?: typeof fetch): Promise<Result<Profile[]>> {
	try {
		return { ok: true, data: await listProfilesApi(fetchImpl) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}

		return {
			ok: false,
			error: {
				message: 'Não foi possível conectar ao servidor.'
			}
		};
	}
}

export function filterActiveProfiles(profiles: Profile[]): Profile[] {
	return profiles.filter((profile) => profile.isActive);
}

export function requiresProfessionalBlock(profile: Profile): boolean {
	return profile.isAssignableTriage || profile.isAssignableMapping;
}
