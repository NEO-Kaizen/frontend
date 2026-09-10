export type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

export type UserStatus = 'Ativo' | 'Inativo';

// Ações disponíveis na tabela de usuários (ciclo do Solicitante).
export type UserAction = 'activate' | 'deactivate' | 'reset';

// Contrato do backend para o gerenciamento de usuários (área administrativa).
export interface AdminUser {
	id: number;
	name: string;
	email: string;
	role: UserType;
	status: UserStatus;
	createdAt: string;
}

export interface ListUsersQuery {
	search?: string;
	page?: number;
	pageSize?: number;
}

export interface CreateUserPayload {
	name: string;
	email: string;
	password: string;
}

export interface CreateUserResponse {
	user: AdminUser;
}

export interface UpdateUserStatusResponse {
	user: AdminUser;
}

export interface ResetPasswordResponse {
	temporaryPassword: string;
}

// Requisitos de senha espelhados do contrato — o backend permanece a
// validação definitiva; o frontend garante a experiência do formulário.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const PASSWORD_REQUIREMENTS = ['Mínimo de 8 caracteres', 'Contém letras e números'];
