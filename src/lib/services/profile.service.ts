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
import type { SessionUser } from '$lib/types/auth';
import type { ProfilePermissionInput } from '$lib/types/profile';
import type { Result } from '$lib/types/result';
import {
	isAllowedPermissionCustody,
	isPermissionCustody,
	isPermissionKey
} from '$lib/types/permission';
import { mapApiError } from '$lib/utils/api-error';

type ProfileOperation<T> = () => Promise<T>;

async function runProfileOperation<T>(operation: ProfileOperation<T>): Promise<Result<T>> {
	try {
		return { ok: true, data: await operation() };
	} catch (error) {
		return mapApiError(error);
	}
}

export function listProfiles(
	actor: SessionUser | null,
	fetchImpl?: typeof fetch
): Promise<Result<Profile[]>> {
	return runProfileOperation(() => listProfilesApi(actor, fetchImpl));
}

export function getProfileKeyCatalog(
	actor: SessionUser | null,
	fetchImpl?: typeof fetch
): Promise<Result<ProfileKeyCatalog>> {
	return runProfileOperation(() => getProfileKeyCatalogApi(actor, fetchImpl));
}

export function createProfile(payload: ProfileCreateInput): Promise<Result<Profile>> {
	if (!hasValidPermissions(payload.permissions)) {
		return Promise.resolve({
			ok: false,
			error: { message: 'A composição contém permissões ou escopos inválidos.' }
		});
	}
	return runProfileOperation(() => createProfileApi(payload));
}

export function updateProfile(id: string, payload: ProfileUpdateInput): Promise<Result<Profile>> {
	if (payload.permissions !== undefined && !hasValidPermissions(payload.permissions)) {
		return Promise.resolve({
			ok: false,
			error: { message: 'A composição contém permissões ou escopos inválidos.' }
		});
	}
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

function hasValidPermissions(value: unknown): value is ProfilePermissionInput[] {
	return Array.isArray(value) && value.every(isProfilePermissionInput);
}

function isProfilePermissionInput(value: unknown): value is ProfilePermissionInput {
	if (typeof value !== 'object' || value === null || !('key' in value) || !('custody' in value)) {
		return false;
	}

	const { key, custody } = value;
	return (
		isPermissionKey(key) && isPermissionCustody(custody) && isAllowedPermissionCustody(key, custody)
	);
}
