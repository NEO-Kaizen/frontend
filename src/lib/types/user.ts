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

// Assignment DTO: backend `GET /users/analysts` retorna só ativos,
// então `isActive` não faz parte do contrato (ver contratos/contract-assign-action.md).
export interface Analyst extends Omit<UserSummary, 'isActive'> {
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

export interface CreateUserProfessionalInput {
	jobTitle: string;
	specialties: string[];
	attendedCategoryIds: number[];
	notes?: string;
}

export interface CreateUserFormData {
	name: string;
	email: string;
	role: UserProfile;
	professional?: CreateUserProfessionalInput;
}

export interface CreateUserPayload {
	fullName: string;
	email: string;
	role: UserProfile;
	professional?: CreateUserProfessionalInput;
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

// "Meus dados" — perfil completo do próprio usuário (GET /users/me).
// Blocos são opcionais no contrato: `requester` pode não existir e
// `professional` só é preenchido para o perfil Analista.
export interface RequesterProfileBlock {
	area: string | null;
	department: string | null;
	manager: string | null;
	additionalContact: string | null;
}

export interface ProfessionalProfileBlock {
	jobTitle: string | null;
	specialties: string[];
	attendedCategoryIds: number[];
	notes: string | null;
}

export interface UserProfileResponse {
	id: string;
	fullName: string;
	email: string;
	role: UserRole;
	avatarUrl: string | null;
	requester: RequesterProfileBlock | null;
	professional: ProfessionalProfileBlock | null;
}

// Payload de PUT /users/me (multipart: campo `payload` = JSON). Enviar apenas
// os blocos alterados; `fullName`/`email`/`role` são imutáveis por contrato.
export interface UpdateRequesterBlock {
	area: string;
	department?: string;
	manager: string;
	additionalContact?: string;
}

export interface UpdateProfessionalBlock {
	jobTitle: string;
	specialties: string[];
	attendedCategoryIds: number[];
	notes?: string;
}

export interface UpdateMyProfileInput {
	requester?: UpdateRequesterBlock;
	professional?: UpdateProfessionalBlock;
	removeAvatar?: boolean;
	avatar?: File;
}
