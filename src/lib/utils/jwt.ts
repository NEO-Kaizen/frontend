import type { SessionUser } from '$lib/types/auth';
import type { UserType } from '$lib/types/user';

const USER_TYPES: readonly string[] = ['Solicitante', 'Analista', 'Administrador', 'Gestor'];

function isUserType(value: unknown): value is UserType {
	return typeof value === 'string' && USER_TYPES.includes(value);
}

export function decodeJwt(token: string): SessionUser | null {
	const payload = token.split('.')[1];

	if (!payload) {
		return null;
	}

	try {
		const decoded = JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>;

		if (
			typeof decoded.id !== 'string' ||
			typeof decoded.name !== 'string' ||
			typeof decoded.email !== 'string' ||
			!isUserType(decoded.role)
		) {
			return null;
		}

		return {
			id: decoded.id,
			name: decoded.name,
			email: decoded.email,
			role: decoded.role
		};
	} catch {
		return null;
	}
}

function base64UrlDecode(value: string): string {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
	return atob(padded);
}
