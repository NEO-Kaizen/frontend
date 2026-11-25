import type { ProfileReference } from './profile';
import type { Permission } from './permission';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	profile: ProfileReference;
	/** Marca estável do Perfil Root. Autorização nunca usa `profile.name`. */
	isRoot: boolean;
	mustChangePassword: boolean;
	permissions: Permission[];
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
	confirmNewPassword: string;
}

// Login e /auth/me devolvem o mesmo DTO de sessão (id string, permissões efetivas).
export type LoginResponse = SessionUser;
