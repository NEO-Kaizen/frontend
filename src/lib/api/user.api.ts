import { apiClient } from './client';

import type { PaginatedResponse } from '$lib/types/request';

import type {
	CreateUserPayload,
	CreateUserResponse,
	ListUsersQuery,
	ResetPasswordResponse,
	UpdateUserStatusResponse,
	UserStats,
	UserSummary
} from '$lib/types/user';

const USERS_PATH = '/users';

export async function listUsers(
	query: ListUsersQuery,
	fetchImpl?: typeof fetch
): Promise<PaginatedResponse<UserSummary>> {
	const params = new URLSearchParams();

	if (query.profile) {
		params.set('profile', query.profile);
	}

	if (query.search) {
		params.set('search', query.search);
	}

	if (query.page !== undefined) {
		params.set('page', String(query.page));
	}

	if (query.pageSize !== undefined) {
		params.set('pageSize', String(query.pageSize));
	}

	const queryString = params.toString();

	const path = queryString ? `${USERS_PATH}?${queryString}` : USERS_PATH;

	return apiClient<PaginatedResponse<UserSummary>>(path, {}, fetchImpl);
}

export async function getUserStats(fetchImpl?: typeof fetch): Promise<UserStats> {
	try {
		return await apiClient<UserStats>(`${USERS_PATH}/metrics`, {}, fetchImpl);
	} catch {
		return { total: 0, active: 0, pending: 0, admins: 0 };
	}
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
	return apiClient<CreateUserResponse>(USERS_PATH, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export async function updateUserStatus(
	id: string,
	isActive: boolean
): Promise<UpdateUserStatusResponse> {
	return apiClient<UpdateUserStatusResponse>(`${USERS_PATH}/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({
			isActive
		})
	});
}

export async function resetUserPassword(id: string): Promise<ResetPasswordResponse> {
	return apiClient<ResetPasswordResponse>(`${USERS_PATH}/${id}/reset-password`, {
		method: 'POST'
	});
}
