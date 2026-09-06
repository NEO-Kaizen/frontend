import { login as loginRequest, logout as logoutRequest } from '$lib/api/auth.api';
import type { LoginCredentials, LoginResponse } from '$lib/types/auth';
import { ApiError, type Result } from '$lib/types/result';

export async function login(credentials: LoginCredentials): Promise<Result<LoginResponse>> {
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

export async function logout(): Promise<void> {
	try {
		await logoutRequest();
	} catch {
		// Falha na invalidação remota não deve bloquear o logout local.
	}
}
