import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { PaginatedResponse } from '$lib/types/request';
import type {
	AdminUser,
	CreateUserPayload,
	CreateUserResponse,
	ListUsersQuery,
	ResetPasswordResponse,
	UpdateUserStatusResponse,
	UserStatus
} from '$lib/types/user';

const USERS_PATH = '/users';

export async function listUsers(query: ListUsersQuery): Promise<PaginatedResponse<AdminUser>> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { listUsersMock } = await import('$lib/mocks/users.mock');

		return listUsersMock(query);
	}

	const params = new URLSearchParams();

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

	return apiClient<PaginatedResponse<AdminUser>>(path);
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
	id: number,
	status: UserStatus
): Promise<UpdateUserStatusResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { updateUserStatusMock } = await import('$lib/mocks/users.mock');

		return updateUserStatusMock(id, status);
	}

	return apiClient<UpdateUserStatusResponse>(`${USERS_PATH}/${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ status })
	});
}

export async function resetUserPassword(id: number): Promise<ResetPasswordResponse> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.users) {
		const { resetUserPasswordMock } = await import('$lib/mocks/users.mock');

		return resetUserPasswordMock(id);
	}

	return apiClient<ResetPasswordResponse>(`${USERS_PATH}/${id}/reset-password`, {
		method: 'POST'
	});
}
