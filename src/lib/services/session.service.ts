import { dev } from '$app/environment';
import type { SessionUser } from '$lib/types/auth';
import {
	isAllowedPermissionCustody,
	isPermissionCustody,
	isPermissionKey,
	type Permission,
	type PermissionCustody,
	type PermissionKey
} from '$lib/types/permission';

export function sanitizeSessionUser(raw: unknown): SessionUser | null {
	const source = isRecord(raw) ? raw : {};
	const id = readString(source.id)?.trim();
	const email = readString(source.email)?.trim();

	if (!id || !email) return null;

	const legacyRoleName = readString(source.role)?.trim() || null;
	const profileName = readProfileName(source.profile);
	const profileIsRoot = readProfileIsRoot(source.profile);

	if (!legacyRoleName && !profileName && dev) {
		// Contrato de sessão incompleto: nem `role` legado nem `profile.name`.
		console.warn('[session] payload sem role/profile.name; usando "Solicitante".', {
			keys: Object.keys(source)
		});
	}

	if (profileIsRoot === null && dev) {
		// O contrato exige `profile.isRoot`; sem ele ninguém é Root na UI.
		console.warn('[session] payload sem profile.isRoot; ator tratado como não Root.', {
			keys: Object.keys(source)
		});
	}

	return {
		id,
		name: readString(source.name) ?? '',
		email,
		avatarUrl: readString(source.avatarUrl),
		profile: {
			id: readProfileId(source.profile) ?? '',
			name: profileName ?? legacyRoleName ?? 'Solicitante'
		},
		isRoot: profileIsRoot === true,
		mustChangePassword: source.mustChangePassword === true,
		permissions: sanitizePermissions(source.permissions)
	};
}

function sanitizePermissions(raw: unknown): Permission[] {
	if (!Array.isArray(raw)) return [];

	const seen = new Set<string>();
	const permissions: Permission[] = [];

	for (const item of raw) {
		if (!isRecord(item)) continue;
		if (!isPermissionKey(item.key) || !isPermissionCustody(item.custody)) continue;
		if (!isAllowedPermissionCustody(item.key, item.custody)) continue;

		const signature = `${item.key}:${item.custody}`;
		if (seen.has(signature)) continue;
		seen.add(signature);

		permissions.push({
			key: item.key as PermissionKey,
			custody: item.custody as PermissionCustody
		});
	}

	return permissions;
}

function readString(value: unknown): string | null {
	return typeof value === 'string' ? value : null;
}

// O `/auth/me` entrega `profile: { id, name, isRoot }`; o `role` legado só é
// usado como fallback de nome, nunca para autorização.
function readProfileName(value: unknown): string | null {
	if (!isRecord(value)) return null;
	return readString(value.name)?.trim() || null;
}

function readProfileId(value: unknown): string | null {
	if (!isRecord(value)) return null;
	return readString(value.id)?.trim() || null;
}

function readProfileIsRoot(value: unknown): boolean | null {
	if (!isRecord(value) || typeof value.isRoot !== 'boolean') return null;
	return value.isRoot;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
