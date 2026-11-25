import {
	GLOBAL_PERMISSION_KEYS,
	isAllowedPermissionCustody,
	PERMISSION_CUSTODIES,
	PERMISSION_KEYS,
	type Permission,
	type PermissionCustody,
	type PermissionKey
} from '$lib/types/permission';

/**
 * Matriz de permissões compartilhada pelos mocks de sessão (`auth.mock.ts`) e
 * de catálogo de Perfis (`profiles.mock.ts`). Fonte única: a alçada
 * administrativa compara as permissões da sessão com as do catálogo, então
 * matrizes divergentes produzem resultado errado na UI.
 */
export function buildProfilePermissions(
	entries: Partial<Record<PermissionCustody, readonly PermissionKey[]>>
): Permission[] {
	const custodyByKey = new Map<PermissionKey, PermissionCustody>();

	for (const custody of PERMISSION_CUSTODIES) {
		for (const key of entries[custody] ?? []) {
			if (!isAllowedPermissionCustody(key, custody)) {
				throw new Error(`Permissão "${key}" não aceita a custódia "${custody}" no mock.`);
			}

			custodyByKey.set(key, custody);
		}
	}

	return PERMISSION_KEYS.filter((key) => custodyByKey.has(key)).map((key) => ({
		key,
		custody: custodyByKey.get(key) as PermissionCustody
	}));
}

export const ALL_PERMISSIONS: Permission[] = PERMISSION_KEYS.map((key) => ({
	key,
	custody:
		key === 'request:track' || key === 'pending_item:respond'
			? 'own'
			: (GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)
				? 'global'
				: 'all'
}));

export const SELF_SERVICE_PERMISSIONS = buildProfilePermissions({
	global: ['request:create'],
	own: ['request:track', 'pending_item:respond']
});

export const ANALYST_PERMISSIONS = buildProfilePermissions({
	global: ['request:create', 'assignee_directory:read'],
	own: ['request:track', 'pending_item:respond'],
	assigned: [
		'request:read',
		'request:write',
		'request:status_change',
		'queue:read',
		'triage:read',
		'triage:write',
		'mapping:read',
		'mapping:write',
		'prioritization:write',
		'pending_item:read',
		'pending_item:write',
		'pending_item:review',
		'internal_note:read',
		'internal_note:write'
	]
});

export const VIEWER_PERMISSIONS = buildProfilePermissions({
	global: ['request:create', 'reports:read', 'assignee_directory:read'],
	own: ['request:track', 'pending_item:respond'],
	all: [
		'request:read',
		'queue:read',
		'queue:export',
		'triage:read',
		'mapping:read',
		'pending_item:read',
		'internal_note:read',
		'internal_note:write',
		'audit:read'
	]
});
