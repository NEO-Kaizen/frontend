import type { UserType } from './user';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface SessionUser {
	id: number;
	name: string;
	email: string;
	role: UserType;
	forcePasswordChange: boolean;
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
}

export interface LoginResponse {
	user: SessionUser;
}
