import {
	createUser as createUserApi,
	listUsers as listUsersApi,
	resetUserPassword as resetUserPasswordApi,
	updateUserStatus as updateUserStatusApi
} from '$lib/api/user.api';

import type { PaginatedResponse } from '$lib/types/request';
import { ApiError, type Result } from '$lib/types/result';

import type {
	AdminUser,
	CreateUserFormData,
	CreateUserResponse,
	ListUsersQuery,
	ResetPasswordResponse,
	UpdateUserStatusResponse,
	UserStatus,
	UserSummary
} from '$lib/types/user';

import { isRequired, isValidEmail, isValidText, PASSWORD_PATTERN } from '$lib/utils/validations';

export async function listUsers(
	query: ListUsersQuery
): Promise<Result<PaginatedResponse<AdminUser>>> {
	try {
		const response = await listUsersApi({
			...query,
			profile: query.profile ?? 'solicitante'
		});

		return {
			ok: true,
			data: {
				...response,
				data: response.data.map(mapUserSummary)
			}
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}

		return {
			ok: false,
			error: {
				message: 'Não foi possível conectar ao servidor.'
			}
		};
	}
}

export async function createUser(data: CreateUserFormData): Promise<Result<CreateUserResponse>> {
	const validation = validateCreateUser(data);

	if (validation) {
		return {
			ok: false,
			error: validation
		};
	}

	try {
		const response = await createUserApi({
			fullName: data.name.trim(),
			email: data.email.trim(),
			role: 'solicitante'
		});

		return {
			ok: true,
			data: response
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}

		return {
			ok: false,
			error: {
				message: 'Não foi possível conectar ao servidor.'
			}
		};
	}
}

export async function updateUserStatus(
	id: string,
	status: UserStatus
): Promise<Result<UpdateUserStatusResponse>> {
	try {
		const response = await updateUserStatusApi(id, status === 'Ativo');

		return {
			ok: true,
			data: response
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}

		return {
			ok: false,
			error: {
				message: 'Não foi possível conectar ao servidor.'
			}
		};
	}
}

export async function resetUserPassword(id: string): Promise<Result<ResetPasswordResponse>> {
	try {
		const response = await resetUserPasswordApi(id);

		return {
			ok: true,
			data: response
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}

		return {
			ok: false,
			error: {
				message: 'Não foi possível conectar ao servidor.'
			}
		};
	}
}

function mapUserSummary(user: UserSummary): AdminUser {
	return {
		id: user.id,
		name: user.fullName,
		email: user.email,
		role: user.profile,
		status: user.isActive ? 'Ativo' : 'Inativo',
		mustChangePassword: user.mustChangePassword,
		createdAt: user.createdAt
	};
}

function validateCreateUser(data: CreateUserFormData): { message: string } | null {
	const name = data.name.trim();
	const email = data.email.trim();

	if (!isRequired(name) || !isValidText(name)) {
		return {
			message: 'Informe um nome válido.'
		};
	}

	if (name.length > 150) {
		return {
			message: 'O nome deve ter no máximo 150 caracteres.'
		};
	}

	if (!isRequired(email)) {
		return {
			message: 'Informe o e-mail.'
		};
	}

	if (!isValidEmail(email)) {
		return {
			message: 'E-mail inválido.'
		};
	}

	if (email.length > 254) {
		return {
			message: 'O e-mail deve ter no máximo 254 caracteres.'
		};
	}

	return null;
}

export function validatePassword(password: string): { message: string } | null {
	if (!isRequired(password)) {
		return {
			message: 'Informe a senha.'
		};
	}

	if (!PASSWORD_PATTERN.test(password)) {
		return {
			message: 'A senha deve ter no mínimo 8 caracteres, com letras e números.'
		};
	}

	return null;
}
