import type { SessionUser } from '$lib/types/auth';
import type { PermissionCustody, PermissionKey } from '$lib/types/permission';

const CUSTODY_CONTAINS: Record<PermissionCustody, readonly PermissionCustody[]> = {
	global: ['global'],
	own: ['own'],
	assigned: ['assigned', 'all'],
	all: ['all']
};

export function has(key: PermissionKey, user: SessionUser | null | undefined): boolean {
	return Boolean(user?.permissions.some((permission) => permission.key === key));
}

export function hasAny(
	keys: readonly PermissionKey[],
	user: SessionUser | null | undefined
): boolean {
	return keys.some((key) => has(key, user));
}

export function can(
	key: PermissionKey,
	custody: PermissionCustody,
	user: SessionUser | null | undefined
): boolean {
	const accepted = CUSTODY_CONTAINS[custody];
	return Boolean(
		user?.permissions.some(
			(permission) => permission.key === key && accepted.includes(permission.custody)
		)
	);
}

export function canGrantCustody(
	actorCustody: PermissionCustody | undefined,
	targetCustody: PermissionCustody
): boolean {
	return actorCustody === targetCustody || (actorCustody === 'all' && targetCustody === 'assigned');
}

// TODO: substituir pelo flag explícito de Root quando o payload de sessão expuser `isRoot`.
export function isRootActor(user: SessionUser | null | undefined): boolean {
	return user?.role === 'Admin Root';
}
