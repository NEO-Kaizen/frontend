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

export function canManageProfile(actor: SessionUser | null, target: Profile): boolean {
	if (!actor || !target.isActive || target.isRoot) return false;
	if (actor.role === 'Admin Root') return true;

	return isAuthorityStrictlyBelow(target.permissions, actor.permissions);
}

export function listManageableProfiles(actor: SessionUser | null, profiles: Profile[]): Profile[] {
	return profiles.filter((profile) => canManageProfile(actor, profile));
}
