import type { UserType } from './user';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role: UserType;
	mustChangePassword: boolean;
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
	confirmNewPassword: string;
}

// Login e /auth/me devolvem o mesmo DTO flat (id string, mustChangePassword).
export type LoginResponse = SessionUser;