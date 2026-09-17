import type { RequestCategory } from './request';

export type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

export type UserRole = UserType;

export type UserProfile = 'solicitante' | 'analista' | 'administrador' | 'gestor';

export type UserStatus = 'Ativo' | 'Inativo';

export type UserAction = 'activate' | 'deactivate' | 'reset';

export interface AdminUser {
	id: string;
	name: string;
	email: string;
	role: UserType;
	status: UserStatus;
	mustChangePassword: boolean;
	createdAt: string;
}

export interface UserSummary {
	id: string;
	fullName: string;
	email: string;
	profile: UserRole;
	isActive: boolean;
	mustChangePassword: boolean;
	createdAt: string;
}

export interface Analyst extends UserSummary {
	specialty: string;
	categories: RequestCategory[];
	notes: string | null;
	requestLoad: number | null;
}

export interface UserStats {
	total: number;
	active: number;
	pending: number;
	admins: number;
}

export interface ListUsersQuery {
	profile?: UserProfile;
	search?: string;
	category?: RequestCategory;
	page?: number;
	pageSize?: number;
}

export interface CreateUserFormData {
	name: string;
	email: string;
	role: UserProfile;
}

export interface CreateUserPayload {
	fullName: string;
	email: string;
	role: UserProfile;
}

export interface CreateUserResponse {
	id: string;
	fullName: string;
	email: string;
	role: UserRole;
	isActive: true;
	mustChangePassword: true;
	createdAt: string;
	temporaryPassword: string;
}

export interface UpdateUserStatusPayload {
	isActive: boolean;
}

export interface UpdateUserStatusResponse {
	id: string;
	isActive: boolean;
}

export interface ResetPasswordResponse {
	id: string;
	temporaryPassword: string;
}
