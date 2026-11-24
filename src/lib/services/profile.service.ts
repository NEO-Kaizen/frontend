import {
	changeProfileStatus as changeProfileStatusApi,
	createProfile as createProfileApi,
	duplicateProfile as duplicateProfileApi,
	getProfileKeyCatalog as getProfileKeyCatalogApi,
	listProfiles as listProfilesApi,
	updateProfile as updateProfileApi
} from '$lib/api/profile.api';
import type {
	DuplicateProfileInput,
	Profile,
	ProfileCreateInput,
	ProfileKeyCatalog,
	ProfileStatusResponse,
	ProfileUpdateInput
} from '$lib/types/profile';
import { ApiError, type Result } from '$lib/types/result';

type ProfileOperation<T> = () => Promise<T>;

async function runProfileOperation<T>(operation: ProfileOperation<T>): Promise<Result<T>> {
	try {
		return { ok: true, data: await operation() };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: error.message }
			};
		}

		return {
			ok: false,
			error: { message: 'Não foi possível conectar ao servidor.' }
		};
	}
}

export function listProfiles(fetchImpl?: typeof fetch): Promise<Result<Profile[]>> {
	return runProfileOperation(() => listProfilesApi(fetchImpl));
}

export function getProfileKeyCatalog(fetchImpl?: typeof fetch): Promise<Result<ProfileKeyCatalog>> {
	return runProfileOperation(() => getProfileKeyCatalogApi(fetchImpl));
}

export function createProfile(payload: ProfileCreateInput): Promise<Result<Profile>> {
	return runProfileOperation(() => createProfileApi(payload));
}

export function updateProfile(id: string, payload: ProfileUpdateInput): Promise<Result<Profile>> {
	return runProfileOperation(() => updateProfileApi(id, payload));
}

export function changeProfileStatus(
	id: string,
	isActive: boolean
): Promise<Result<ProfileStatusResponse>> {
	return runProfileOperation(() => changeProfileStatusApi(id, isActive));
}

export function duplicateProfile(
	id: string,
	payload: DuplicateProfileInput
): Promise<Result<Profile>> {
	return runProfileOperation(() => duplicateProfileApi(id, payload));
}
