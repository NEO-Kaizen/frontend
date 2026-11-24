import type { SessionUser } from '$lib/types/auth';
import type { Profile } from '$lib/types/profile';
import { isAuthorityStrictlyBelow, isRootActor } from '$lib/utils/permission-checks';

export function canManageProfile(actor: SessionUser | null, target: Profile): boolean {
	if (!actor || !target.isActive || target.isRoot) return false;
	if (isRootActor(actor)) return true;

	return isAuthorityStrictlyBelow(target.permissions, actor.permissions);
}

export function listManageableProfiles(actor: SessionUser | null, profiles: Profile[]): Profile[] {
	return profiles.filter((profile) => canManageProfile(actor, profile));
}
