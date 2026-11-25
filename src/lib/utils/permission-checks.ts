import type { SessionUser } from '$lib/types/auth';
import type { Permission, PermissionCustody, PermissionKey } from '$lib/types/permission';
import type { Profile } from '$lib/types/profile';

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

export function isRootActor(user: SessionUser | null | undefined): boolean {
	return user?.isRoot === true;
}

function containsAll(
	targetGrants: readonly Permission[] | undefined,
	actorGrants: readonly Permission[] | undefined
): boolean {
	if (!Array.isArray(targetGrants) || !Array.isArray(actorGrants)) return false;

	const actorPermissions = new Map(actorGrants.map((grant) => [grant.key, grant.custody] as const));

	return targetGrants.every((grant) => {
		const actorCustody = actorPermissions.get(grant.key);
		return actorCustody !== undefined && canGrantCustody(actorCustody, grant.custody);
	});
}

export function isAuthorityStrictlyBelow(
	targetGrants: readonly Permission[] | undefined,
	actorGrants: readonly Permission[] | undefined
): boolean {
	return containsAll(targetGrants, actorGrants) && !containsAll(actorGrants, targetGrants);
}

export function canEditProfile(actor: SessionUser | null | undefined, target: Profile): boolean {
	if (!actor) return false;
	if (isRootActor(actor)) return true;
	if (target.isRoot) return false;

	return isAuthorityStrictlyBelow(target.permissions, actor.permissions);
}
