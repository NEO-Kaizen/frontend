import { apiClient } from './client';
import type { LoginCredentials, LoginResponse } from '$lib/types/auth';

import { mockLogin } from '$lib/mocks/auth'; // código para mocks, remover quando lançar PR
import { env } from '$env/dynamic/public'; // código para mocks, remover quando lançar PR
const USE_MOCKS = env.PUBLIC_USE_MOCKS === 'true'; // código para mocks, remover quando lançar PR

const AUTH_PATH = '/auth/login';

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
	if (USE_MOCKS) {
		// código para mocks, remover quando lançar PR
		return mockLogin(credentials);
	}

	return apiClient<LoginResponse>(AUTH_PATH, {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}
