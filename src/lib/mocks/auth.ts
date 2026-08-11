import { ApiError } from '$lib/api/client';
import type { LoginCredentials, LoginResponse } from '$lib/types/auth';

const MOCK_DELAY_MS = 800;

// Credenciais fictícias — nunca utilizar dados reais em mocks.
const MOCK_EMAIL = 'admin@neo.com';
const MOCK_PASSWORD = 'neo123';

// E-mail fictício que simula um erro inesperado (500) para validar o tratamento visual.
const MOCK_ERROR_EMAIL = 'erro@neo.com';

export async function mockLogin(credentials: LoginCredentials): Promise<LoginResponse> {
	await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

	if (credentials.email === MOCK_ERROR_EMAIL) {
		throw new ApiError(500, 'Internal Server Error');
	}

	if (credentials.email !== MOCK_EMAIL || credentials.password !== MOCK_PASSWORD) {
		throw new ApiError(401, 'Invalid credentials');
	}

	return {
		token: 'mock-token-para-teste',
		user: {
			id: 'mock-user-1',
			name: 'Admin NEO',
			email: MOCK_EMAIL,
			role: 'admin'
		}
	};
}
