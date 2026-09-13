export type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

export type UserStatus = 'Ativo' | 'Inativo';

export type UserAction = 'activate' | 'deactivate' | 'reset';

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

export interface CreateUserData {
	name: string;
	email: string;
	role: UserType;
	status: UserStatus;
}

export interface CreateUserPayload {
	name: string;
	email: string;
	role: UserType;
	status: UserStatus;
}

export interface CreateUserResponse {
	user: AdminUser;
	temporaryPassword: string;
}

export interface UpdateUserStatusResponse {
	user: AdminUser;
}

export interface ResetPasswordResponse {
	temporaryPassword: string;
}
