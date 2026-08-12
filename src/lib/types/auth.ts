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
}

export interface LoginResponse {
	user: SessionUser;
}
