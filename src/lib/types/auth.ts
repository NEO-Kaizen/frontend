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
	// professionalId é o professionals.professional_id (UUID) vinculado ao
	// usuário no backend; `null` quando não há vínculo. /queue filtra por ele
	// (assigneeId), nunca por users.user_id.
	professionalId: string | null;
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
	confirmNewPassword: string;
}

// Login e /auth/me devolvem o mesmo DTO flat
// (id string = users.user_id, professionalId = professionals.professional_id).
export type LoginResponse = SessionUser;
