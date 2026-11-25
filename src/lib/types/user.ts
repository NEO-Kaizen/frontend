import type { ProfileReference } from '$lib/types/profile';
import type { RequestCategory } from './request';

export type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

export type UserStatus = 'Ativo' | 'Inativo';

export type UserAction = 'activate' | 'deactivate' | 'reset' | 'edit';

export interface AdminUser {
	id: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	profile: ProfileReference;
	status: UserStatus;
	mustChangePassword: boolean;
	createdAt: string;
}

export interface UserSummary {
	id: string;
	fullName: string;
	email: string;
	avatarUrl: string | null;
	profile: ProfileReference;
	isActive: boolean;
	mustChangePassword: boolean;
	createdAt: string;
}

// Assignment DTO: backend `GET /users/analysts` retorna só ativos,
// então `isActive` não faz parte do contrato.
export interface Analyst {
	id: string;
	fullName: string;
	email: string;
	specialty: string;
	categories: RequestCategory[];
	notes: string | null;
	requestLoad: number;
}

export interface UserStats {
	total: number;
	active: number;
	pending: number;
	admins: number;
}

export interface ListUsersQuery {
	profileId?: string;
	search?: string;
	category?: RequestCategory;
	page?: number;
	pageSize?: number;
}

export interface CreateUserFormData {
	name: string;
	email: string;
	profileId: string;
	area: string;
	department?: string;
	manager: string;
	additionalContact?: string;
	professional?: UpdateProfessionalBlock;
}

export interface CreateUserPayload {
	fullName: string;
	email: string;
	profileId: string;
	requester: {
		area: string;
		department?: string;
		manager: string;
		additionalContact?: string;
	};
	professional?: UpdateProfessionalBlock;
}

export interface CreateUserResponse {
	id: string;
	fullName: string;
	email: string;
	profile: ProfileReference;
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
// `professional` só é preenchido para Perfis designáveis na triagem/mapeamento.
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
	profile: ProfileReference;
	avatarUrl: string | null;
	requester: RequesterProfileBlock | null;
	professional: ProfessionalProfileBlock | null;
}

// Payload de PUT /users/me (multipart: campo `payload` = JSON). Nome, contato
// adicional e foto são autoeditáveis por todos. O próprio Administrador também
// pode alterar seus dados administrativos de solicitante.
export interface UpdateRequesterBlock {
	area?: string;
	department?: string | null;
	manager?: string;
	additionalContact?: string | null;
}

export interface UpdateProfessionalBlock {
	jobTitle: string;
	specialties: string[];
	attendedCategoryIds: number[];
	notes?: string;
}

export interface UpdateMyProfileInput {
	fullName?: string;
	requester?: UpdateRequesterBlock;
	removeAvatar?: boolean;
	avatar?: File;
}

export interface UpdateUserInput {
	profileId?: string;
	fullName?: string;
	requester?: {
		area?: string;
		department?: string | null;
		manager?: string;
	};
	professional?: UpdateProfessionalBlock;
}
