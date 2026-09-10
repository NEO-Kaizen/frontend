import { ApiError, type Result } from '$lib/types/result';
import {
	createUser as createUserApi,
	listUsers as listUsersApi,
	resetUserPassword as resetUserPasswordApi,
	updateUserStatus as updateUserStatusApi
} from '$lib/api/user.api';
import type { PaginatedResponse } from '$lib/types/request';
import { PASSWORD_PATTERN } from '$lib/types/user';
import type {
	AdminUser,
	CreateUserPayload,
	CreateUserResponse,
	ListUsersQuery,
	ResetPasswordResponse,
	UpdateUserStatusResponse,
	UserStatus
} from '$lib/types/user';
import { isRequired, isValidEmail, isValidText } from '$lib/utils/validations';

export async function listUsers(
	query: ListUsersQuery
): Promise<Result<PaginatedResponse<AdminUser>>> {
	try {
		const data = await listUsersApi(query);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: 'Não foi possível carregar os usuários.' }
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function createUser(
	payload: CreateUserPayload,
	passwordConfirmation: string
): Promise<Result<CreateUserResponse>> {
	const validation = validateCreateUser(payload, passwordConfirmation);
	if (validation) {
		return { ok: false, error: validation };
	}

	try {
		const data = await createUserApi(payload);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.status === 409) {
				return { ok: false, error: { status: error.status, message: 'E-mail já cadastrado.' } };
			}
			return { ok: false, error: { status: error.status, message: error.message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function updateUserStatus(
	id: number,
	status: UserStatus
): Promise<Result<UpdateUserStatusResponse>> {
	try {
		const data = await updateUserStatusApi(id, status);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: 'Não foi possível atualizar o usuário.' }
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function resetUserPassword(id: number): Promise<Result<ResetPasswordResponse>> {
	try {
		const data = await resetUserPasswordApi(id);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: 'Não foi possível redefinir a senha.' }
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

function validateCreateUser(
	payload: CreateUserPayload,
	passwordConfirmation: string
): { message: string } | null {
	if (!isRequired(payload.name) || !isValidText(payload.name)) {
		return { message: 'Informe um nome válido.' };
	}

	if (!isRequired(payload.email)) {
		return { message: 'Informe o e-mail.' };
	}

	if (!isValidEmail(payload.email)) {
		return { message: 'E-mail inválido.' };
	}

	const passwordValidation = validatePassword(payload.password);
	if (passwordValidation) {
		return passwordValidation;
	}

	if (payload.password !== passwordConfirmation) {
		return { message: 'A confirmação de senha não confere.' };
	}

	return null;
}

export function validatePassword(password: string): { message: string } | null {
	if (!isRequired(password)) {
		return { message: 'Informe a senha.' };
	}

	if (!PASSWORD_PATTERN.test(password)) {
		return { message: 'A senha deve ter no mínimo 8 caracteres, com letras e números.' };
	}

	return null;
}
