import type { SessionUser } from '$lib/types/auth';
import type { Permission } from '$lib/types/permission';
import type { Profile } from '$lib/types/profile';
import { canGrantCustody, isRootActor } from '$lib/utils/permission-checks';

function containsAll(
	targetGrants: Permission[] | undefined,
	actorGrants: Permission[] | undefined
): boolean {
	if (!Array.isArray(targetGrants) || !Array.isArray(actorGrants)) return false;

	const actorPermissions = new Map(actorGrants.map((grant) => [grant.key, grant.custody] as const));

	return targetGrants.every((grant) => {
		const actorCustody = actorPermissions.get(grant.key);
		return actorCustody !== undefined && canGrantCustody(actorCustody, grant.custody);
	});
}

export function isAuthorityStrictlyBelow(
	targetGrants: Permission[] | undefined,
	actorGrants: Permission[] | undefined
): boolean {
	return containsAll(targetGrants, actorGrants) && !containsAll(actorGrants, targetGrants);
}

export function canManageProfile(actor: SessionUser | null, target: Profile): boolean {
	if (!actor || !target.isActive || target.isRoot) return false;
	if (isRootActor(actor)) return true;

	return isAuthorityStrictlyBelow(target.permissions, actor.permissions);
}

export function listManageableProfiles(actor: SessionUser | null, profiles: Profile[]): Profile[] {
	return profiles.filter((profile) => canManageProfile(actor, profile));
}
