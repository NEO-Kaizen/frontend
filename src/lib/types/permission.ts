export const PERMISSION_KEYS = [
	'request:create',
	'request:track',
	'request:read',
	'request:write',
	'request:assign',
	'request:status_change',
	'request:status_override',
	'queue:read',
	'queue:export',
	'reports:read',
	'triage:read',
	'triage:write',
	'mapping:read',
	'mapping:write',
	'prioritization:write',
	'pending_item:read',
	'pending_item:write',
	'pending_item:review',
	'pending_item:respond',
	'internal_note:read',
	'internal_note:write',
	'audit:read',
	'assignee_directory:read',
	'user:read',
	'user:manage',
	'profile:read',
	'profile:manage',
	'theme:read',
	'theme:manage',
	'category:read',
	'category:manage',
	'status:read',
	'status:manage',
	'portal_setting:read',
	'portal_setting:manage',
	'prioritization_config:read',
	'prioritization_config:manage',
	'form:read',
	'form:manage'
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_CUSTODIES = ['global', 'own', 'assigned', 'all'] as const;

export type PermissionCustody = (typeof PERMISSION_CUSTODIES)[number];

export interface Permission {
	key: PermissionKey;
	custody: PermissionCustody;
}

export const GLOBAL_PERMISSION_KEYS = [
	'request:create',
	'request:status_override',
	'reports:read',
	'assignee_directory:read',
	'user:read',
	'user:manage',
	'profile:read',
	'profile:manage',
	'theme:read',
	'theme:manage',
	'category:read',
	'category:manage',
	'status:read',
	'status:manage',
	'portal_setting:read',
	'portal_setting:manage',
	'prioritization_config:read',
	'prioritization_config:manage',
	'form:read',
	'form:manage'
] as const satisfies readonly PermissionKey[];

export const OPERATIONAL_AREA_KEYS = [
	'request:read',
	'request:write',
	'request:assign',
	'request:status_change',
	'request:status_override',
	'queue:read',
	'queue:export',
	'reports:read',
	'triage:read',
	'triage:write',
	'mapping:read',
	'mapping:write',
	'prioritization:write',
	'pending_item:read',
	'pending_item:write',
	'pending_item:review',
	'internal_note:read',
	'internal_note:write',
	'audit:read',
	'assignee_directory:read',
	'user:read',
	'user:manage',
	'profile:read',
	'profile:manage'
] as const satisfies readonly PermissionKey[];

export const SELF_SERVICE_KEYS = [
	'request:create',
	'request:track',
	'pending_item:respond'
] as const satisfies readonly PermissionKey[];

export const PORTAL_READ_KEYS = [
	'theme:read',
	'category:read',
	'status:read',
	'portal_setting:read',
	'prioritization_config:read'
] as const satisfies readonly PermissionKey[];

export function isPermissionKey(value: unknown): value is PermissionKey {
	return typeof value === 'string' && (PERMISSION_KEYS as readonly string[]).includes(value);
}

export function isPermissionCustody(value: unknown): value is PermissionCustody {
	return typeof value === 'string' && (PERMISSION_CUSTODIES as readonly string[]).includes(value);
}

export function isAllowedPermissionCustody(
	key: PermissionKey,
	custody: PermissionCustody
): boolean {
	if ((GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)) return custody === 'global';
	if ((SELF_SERVICE_KEYS as readonly string[]).includes(key)) return custody === 'own';
	return custody === 'assigned' || custody === 'all';
}
