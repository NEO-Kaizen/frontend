import {
	login as loginRequest,
	logout as logoutRequest,
	getMe as getMeRequest,
	changePassword as changePasswordRequest
} from '$lib/api/auth.api';
import type {
	ChangePasswordPayload,
	LoginCredentials,
	LoginResponse,
	SessionUser
} from '$lib/types/auth';
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

export async function getMe(): Promise<Result<SessionUser>> {
	try {
		const data = await getMeRequest();
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: 'Sessão expirada ou inválida.' }
			};
		}
		return { ok: false, error: { message: 'Não foi possível validar a sessão.' } };
	}
}

export async function changePassword(payload: ChangePasswordPayload): Promise<Result<void>> {
	try {
		await changePasswordRequest(payload);
		return { ok: true, data: undefined };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message || 'Não foi possível alterar a senha.'
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}
