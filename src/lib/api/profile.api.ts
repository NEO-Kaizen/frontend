import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	DuplicateProfileInput,
	Profile,
	ProfileCreateInput,
	ProfileKeyCatalog,
	ProfileStatusResponse,
	ProfileUpdateInput
} from '$lib/types/profile';
import type { SessionUser } from '$lib/types/auth';

const PROFILES_PATH = '/profiles';

export async function listProfiles(
	actor: SessionUser | null,
	fetchImpl?: typeof fetch
): Promise<Profile[]> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.profiles) {
		const { listProfilesMock } = await import('$lib/mocks/profiles.mock');
		return listProfilesMock(actor);
	}

	return apiClient<Profile[]>(PROFILES_PATH, {}, fetchImpl);
}

export async function getProfileKeyCatalog(
	actor: SessionUser | null,
	fetchImpl?: typeof fetch
): Promise<ProfileKeyCatalog> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.profiles) {
		const { getProfileKeyCatalogMock } = await import('$lib/mocks/profiles.mock');
		return getProfileKeyCatalogMock(actor);
	}

	return apiClient<ProfileKeyCatalog>(`${PROFILES_PATH}/keys`, {}, fetchImpl);
}

export async function createProfile(payload: ProfileCreateInput): Promise<Profile> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.profiles) {
		const { createProfileMock } = await import('$lib/mocks/profiles.mock');
		return createProfileMock(payload);
	}

	return apiClient<Profile>(PROFILES_PATH, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export async function updateProfile(id: string, payload: ProfileUpdateInput): Promise<Profile> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.profiles) {
		const { updateProfileMock } = await import('$lib/mocks/profiles.mock');
		return updateProfileMock(id, payload);
	}

	return apiClient<Profile>(`${PROFILES_PATH}/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

export async function changeProfileStatus(
	id: string,
	isActive: boolean
): Promise<ProfileStatusResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.profiles) {
		const { changeProfileStatusMock } = await import('$lib/mocks/profiles.mock');
		return changeProfileStatusMock(id, isActive);
	}

	return apiClient<ProfileStatusResponse>(`${PROFILES_PATH}/${encodeURIComponent(id)}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ isActive })
	});
}

export async function duplicateProfile(
	id: string,
	payload: DuplicateProfileInput
): Promise<Profile> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.profiles) {
		const { duplicateProfileMock } = await import('$lib/mocks/profiles.mock');
		return duplicateProfileMock(id, payload);
	}

	return apiClient<Profile>(`${PROFILES_PATH}/${encodeURIComponent(id)}/duplicate`, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}
