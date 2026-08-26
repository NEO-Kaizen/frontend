import { apiClient } from './client';
import type { LoginCredentials, LoginResponse } from '$lib/types/auth';

const AUTH_PATH = '/auth/login';
const LOGOUT_PATH = '/auth/logout';

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
	return apiClient<LoginResponse>(AUTH_PATH, {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}

export function logout(): Promise<unknown> {
	return apiClient<unknown>(LOGOUT_PATH, { method: 'POST' });
}
