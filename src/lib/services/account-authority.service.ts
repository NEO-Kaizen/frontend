import type { SessionUser } from '$lib/types/auth';
import type { Permission, PermissionCustody } from '$lib/types/permission';
import type { Profile } from '$lib/types/profile';

function custodyContains(
	actorCustody: PermissionCustody,
	targetCustody: PermissionCustody
): boolean {
	return actorCustody === targetCustody || (actorCustody === 'all' && targetCustody === 'assigned');
}

function containsAll(targetGrants: Permission[], actorGrants: Permission[]): boolean {
	const actorPermissions = new Map(actorGrants.map((grant) => [grant.key, grant.custody] as const));

	return targetGrants.every((grant) => {
		const actorCustody = actorPermissions.get(grant.key);
		return actorCustody !== undefined && custodyContains(actorCustody, grant.custody);
	});
}

export function isAuthorityStrictlyBelow(
	targetGrants: Permission[],
	actorGrants: Permission[]
): boolean {
	return containsAll(targetGrants, actorGrants) && !containsAll(actorGrants, targetGrants);
}

export function isRootActor(actor: SessionUser | null): boolean {
	return actor?.role === 'Admin Root';
}

function hasAuthorityOverProfile(actor: SessionUser | null, target: Profile): boolean {
	if (!actor || target.isRoot) return false;
	if (isRootActor(actor)) return true;

	return isAuthorityStrictlyBelow(target.permissions, actor.permissions);
}

export function canAssignProfile(actor: SessionUser | null, target: Profile): boolean {
	return target.isActive && hasAuthorityOverProfile(actor, target);
}

export function canManageUserWithProfile(actor: SessionUser | null, target: Profile): boolean {
	return hasAuthorityOverProfile(actor, target);
}

export function listAssignableProfiles(actor: SessionUser | null, profiles: Profile[]): Profile[] {
	return profiles.filter((profile) => canAssignProfile(actor, profile));
}

export function listAdministrableProfiles(
	actor: SessionUser | null,
	profiles: Profile[]
): Profile[] {
	return profiles.filter((profile) => canManageUserWithProfile(actor, profile));
}
