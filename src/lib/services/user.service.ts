import {
	createUser as createUserApi,
	getUser as getUserApi,
	getMyProfile as getMyProfileApi,
	getUserStats as getUserStatsApi,
	listUsers as listUsersApi,
	resetUserPassword as resetUserPasswordApi,
	updateMyProfile as updateMyProfileApi,
	updateUser as updateUserApi,
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
	UpdateMyProfileInput,
	UpdateUserInput,
	UpdateUserStatusResponse,
	UserProfileResponse,
	UserStats,
	UserStatus,
	UserSummary
} from '$lib/types/user';

import {
	isRequired,
	isValidEmail,
	isValidText,
	PASSWORD_PATTERN,
	PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH,
	PROFILE_AREA_MAX_LENGTH,
	PROFILE_DEPARTMENT_MAX_LENGTH,
	PROFILE_JOB_TITLE_MAX_LENGTH,
	PROFILE_MANAGER_MAX_LENGTH,
	PROFILE_NOTES_MAX_LENGTH,
	PROFILE_SPECIALTY_MAX_LENGTH
} from '$lib/utils/validations';

export async function listUsers(
	query: ListUsersQuery,
	fetchImpl?: typeof fetch
): Promise<Result<PaginatedResponse<AdminUser>>> {
	try {
		const response = await listUsersApi(query, fetchImpl);

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

export async function getUserStats(fetchImpl?: typeof fetch): Promise<UserStats> {
	return getUserStatsApi(fetchImpl);
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
			role: data.role,
			requester: {
				area: data.area.trim(),
				department: data.department?.trim() || undefined,
				manager: data.manager.trim(),
				additionalContact: data.additionalContact?.trim() || undefined
			},
			professional: data.professional
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

// "Meus dados" — leitura e gravação do próprio perfil. Nome, contato adicional
// e avatar são autoeditáveis; o Administrador também pode editar seus próprios
// área, departamento e gestor. O service traduz erros da API.
export async function getMyProfile(fetchImpl?: typeof fetch): Promise<Result<UserProfileResponse>> {
	try {
		const data = await getMyProfileApi(fetchImpl);

		return {
			ok: true,
			data
		};
	} catch (error) {
		return mapApiError(error);
	}
}

export async function updateMyProfile(
	input: UpdateMyProfileInput
): Promise<Result<UserProfileResponse>> {
	try {
		const data = await updateMyProfileApi(input);

		return {
			ok: true,
			data
		};
	} catch (error) {
		return mapApiError(error);
	}
}

export async function getUser(id: string): Promise<Result<UserProfileResponse>> {
	try {
		return { ok: true, data: await getUserApi(id) };
	} catch (error) {
		return mapApiError(error);
	}
}

export async function updateUser(
	id: string,
	input: UpdateUserInput
): Promise<Result<UserProfileResponse>> {
	try {
		return { ok: true, data: await updateUserApi(id, input) };
	} catch (error) {
		return mapApiError(error);
	}
}

function mapApiError<T>(error: unknown): Result<T> {
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

function mapUserSummary(user: UserSummary): AdminUser {
	return {
		id: user.id,
		name: user.fullName,
		email: user.email,
		avatarUrl: user.avatarUrl,
		role: user.profile,
		status: user.isActive ? 'Ativo' : 'Inativo',
		mustChangePassword: user.mustChangePassword,
		createdAt: user.createdAt
	};
}

function validateCreateUser(data: CreateUserFormData): { message: string } | null {
	const name = data.name.trim();
	const email = data.email.trim();
	const area = data.area?.trim() ?? '';
	const department = data.department?.trim() ?? '';
	const manager = data.manager?.trim() ?? '';
	const additionalContact = data.additionalContact?.trim() ?? '';

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

	if (!isRequired(area) || !isValidText(area)) {
		return {
			message: 'Informe a área do solicitante.'
		};
	}

	if (area.length > PROFILE_AREA_MAX_LENGTH) {
		return {
			message: `A área deve ter no máximo ${PROFILE_AREA_MAX_LENGTH} caracteres.`
		};
	}

	if (department && !isValidText(department)) {
		return {
			message: 'O departamento deve conter apenas letras e espaços.'
		};
	}

	if (department.length > PROFILE_DEPARTMENT_MAX_LENGTH) {
		return {
			message: `O departamento deve ter no máximo ${PROFILE_DEPARTMENT_MAX_LENGTH} caracteres.`
		};
	}

	if (!isRequired(manager) || !isValidText(manager)) {
		return {
			message: 'Informe o gestor responsável.'
		};
	}

	if (manager.length > PROFILE_MANAGER_MAX_LENGTH) {
		return {
			message: `O gestor deve ter no máximo ${PROFILE_MANAGER_MAX_LENGTH} caracteres.`
		};
	}

	if (additionalContact && additionalContact.length < 3) {
		return {
			message: 'Informe um contato adicional válido.'
		};
	}

	if (additionalContact.length > PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH) {
		return {
			message: `O contato deve ter no máximo ${PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH} caracteres.`
		};
	}

	if (data.role === 'analista') {
		const professional = data.professional;
		if (!professional?.jobTitle.trim()) {
			return { message: 'Informe o cargo do analista.' };
		}
		if (professional.jobTitle.trim().length > PROFILE_JOB_TITLE_MAX_LENGTH) {
			return { message: `O cargo deve ter no máximo ${PROFILE_JOB_TITLE_MAX_LENGTH} caracteres.` };
		}
		if (professional.specialties.length === 0) {
			return { message: 'Informe ao menos uma especialidade.' };
		}
		if (professional.specialties.some((item) => item.length > PROFILE_SPECIALTY_MAX_LENGTH)) {
			return {
				message: `Cada especialidade deve ter no máximo ${PROFILE_SPECIALTY_MAX_LENGTH} caracteres.`
			};
		}
		if (professional.attendedCategoryIds.length === 0) {
			return { message: 'Selecione ao menos uma categoria atendida.' };
		}
		if ((professional.notes?.length ?? 0) > PROFILE_NOTES_MAX_LENGTH) {
			return {
				message: `As observações devem ter no máximo ${PROFILE_NOTES_MAX_LENGTH} caracteres.`
			};
		}
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
