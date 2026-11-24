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

	return {
		id,
		name: readString(source.name) ?? '',
		email,
		avatarUrl: readString(source.avatarUrl),
		role: readString(source.role) || 'Solicitante',
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
