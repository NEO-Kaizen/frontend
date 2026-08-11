import { ApiError } from '$lib/api/client';
import { login as loginRequest } from '$lib/api/auth.api';
import type { LoginCredentials, LoginResponse } from '$lib/types/auth';

type LoginResult =
	{ ok: true; data: LoginResponse } | { ok: false; error: { status?: number; message: string } };

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
	try {
		const data = await loginRequest(credentials);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: { status: error.status, message: 'Credenciais inválidas.' } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}
