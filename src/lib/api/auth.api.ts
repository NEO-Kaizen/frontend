import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { LoginCredentials, LoginResponse } from '$lib/types/auth';

const AUTH_PATH = '/auth/login';
const LOGOUT_PATH = '/auth/logout';

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
