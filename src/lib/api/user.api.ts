import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';

import type { PaginatedResponse } from '$lib/types/request';

import type {
	Analyst,
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
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { listUsersMock } = await import('$lib/mocks/users.mock');
		return listUsersMock(query);
	}

	const params = new URLSearchParams();

	if (query.profile) {
		params.set('profile', query.profile);
	}

	if (query.search?.trim()) {
		params.set('search', query.search.trim());
	}

	if (query.category) {
		params.set('category', query.category);
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

export async function listAnalysts(fetchImpl?: typeof fetch): Promise<Analyst[]> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { listAnalystsMock } = await import('$lib/mocks/users.mock');
		return listAnalystsMock();
	}

	return apiClient<Analyst[]>(`${USERS_PATH}/analysts`, {}, fetchImpl);
}

export async function getUserStats(fetchImpl?: typeof fetch): Promise<UserStats> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { getUserStatsMock } = await import('$lib/mocks/users.mock');
		return getUserStatsMock();
	}

	try {
		return await apiClient<UserStats>(`${USERS_PATH}/metrics`, {}, fetchImpl);
	} catch {
		return { total: 0, active: 0, pending: 0, admins: 0 };
	}
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { createUserMock } = await import('$lib/mocks/users.mock');
		return createUserMock(payload);
	}

	return apiClient<CreateUserResponse>(USERS_PATH, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

export async function updateUserStatus(
	id: string,
	isActive: boolean
): Promise<UpdateUserStatusResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { updateUserStatusMock } = await import('$lib/mocks/users.mock');
		return updateUserStatusMock(id, isActive);
	}

	return apiClient<UpdateUserStatusResponse>(`${USERS_PATH}/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({
			isActive
		})
	});
}

export async function resetUserPassword(id: string): Promise<ResetPasswordResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { resetUserPasswordMock } = await import('$lib/mocks/users.mock');
		return resetUserPasswordMock(id);
	}

	return apiClient<ResetPasswordResponse>(`${USERS_PATH}/${id}/reset-password`, {
		method: 'POST'
	});
}
