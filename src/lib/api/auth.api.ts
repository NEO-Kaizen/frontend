import { apiClient } from './client';
import type { LoginCredentials, LoginResponse } from '$lib/types/auth';

const AUTH_PATH = '/auth/login';

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
	return apiClient<LoginResponse>(AUTH_PATH, {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}
