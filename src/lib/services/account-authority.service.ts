import type { SessionUser } from '$lib/types/auth';
import type { Permission, PermissionCustody } from '$lib/types/permission';
import type { Profile } from '$lib/types/profile';
import { isRootActor } from '$lib/utils/permission-checks';

function custodyContains(
	actorCustody: PermissionCustody,
	targetCustody: PermissionCustody
): boolean {
	return actorCustody === targetCustody || (actorCustody === 'all' && targetCustody === 'assigned');
}

type PermissionGrants = Permission[] | null | undefined;

function normalizeGrants(grants: PermissionGrants): Permission[] {
	return Array.isArray(grants) ? grants : [];
}

// Mesma semântica do backend: alvo sem permissões é considerado contido em
// qualquer ator (domínio vazio), então fica estritamente abaixo de um ator com
// permissões e pode ser administrado por ele.
function containsAll(targetGrants: PermissionGrants, actorGrants: PermissionGrants): boolean {
	const target = normalizeGrants(targetGrants);
	const actor = normalizeGrants(actorGrants);

	// Alvo vazio é vacuamente contido (`every` em array vazio ⇒ true).
	if (target.length === 0) return true;

	const actorPermissions = new Map(actor.map((grant) => [grant.key, grant.custody] as const));

	return target.every((grant) => {
		const actorCustody = actorPermissions.get(grant.key);
		return actorCustody !== undefined && custodyContains(actorCustody, grant.custody);
	});
}

function isAuthorityStrictlyBelow(
	targetGrants: PermissionGrants,
	actorGrants: PermissionGrants
): boolean {
	return containsAll(targetGrants, actorGrants) && !containsAll(actorGrants, targetGrants);
}

function hasAuthorityOverProfile(actor: SessionUser | null, target: Profile): boolean {
	if (!actor || target.isRoot) return false;
	if (isRootActor(actor)) return true;

	return isAuthorityStrictlyBelow(target.permissions, actor.permissions);
}

// Edição/alteração de status exigem alvo ativo e estritamente abaixo do ator.
export function canManageProfile(actor: SessionUser | null, target: Profile): boolean {
	if (!actor || !target.isActive || target.isRoot) return false;

	return hasAuthorityOverProfile(actor, target);
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
