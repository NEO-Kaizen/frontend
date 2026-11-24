import type { UserType } from './user';
import type { Permission } from './permission';

export interface LoginCredentials {
	email: string;
	password: string;
}

export type SessionRole = UserType | (string & {});

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	role: SessionRole;
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
