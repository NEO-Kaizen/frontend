import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type {
	ChangePasswordPayload,
	LoginCredentials,
	LoginResponse,
	SessionUser
} from '$lib/types/auth';

const AUTH_PATH = '/auth/login';
const LOGOUT_PATH = '/auth/logout';
const ME_PATH = '/auth/me';
const CHANGE_PASSWORD_PATH = '/auth/change-password';

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.auth) {
		const { loginMock } = await import('$lib/mocks/auth.mock');
		return loginMock(credentials);
	}

	return apiClient<LoginResponse>(AUTH_PATH, {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}

export async function logout(): Promise<unknown> {
	// DEV inline no ponto de chamada garante a eliminação do mock no build (DCE).
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.auth) {
		const { logoutMock } = await import('$lib/mocks/auth.mock');
		return logoutMock();
	}

	return apiClient<unknown>(LOGOUT_PATH, { method: 'POST' });
}

export async function getMe(): Promise<SessionUser> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.auth) {
		const { getMeMock } = await import('$lib/mocks/auth.mock');
		return getMeMock();
	}

	return apiClient<SessionUser>(ME_PATH);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.auth) {
		const { changePasswordMock } = await import('$lib/mocks/auth.mock');
		return changePasswordMock(payload);
	}

	await apiClient<void>(CHANGE_PASSWORD_PATH, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
}
