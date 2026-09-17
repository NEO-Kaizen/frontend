import { apiClient } from './client';
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
	return apiClient<LoginResponse>(AUTH_PATH, {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}

export async function logout(): Promise<unknown> {
	return apiClient<unknown>(LOGOUT_PATH, { method: 'POST' });
}

// A sessão é validada exclusivamente por HTTP via cookie (`credentials:
// 'include'`); em SSR o `fetchImpl` do load repassa o cookie do usuário.
export async function getMe(fetchImpl?: typeof fetch): Promise<SessionUser> {
	return apiClient<SessionUser>(ME_PATH, {}, fetchImpl);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
	await apiClient<void>(CHANGE_PASSWORD_PATH, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
}
