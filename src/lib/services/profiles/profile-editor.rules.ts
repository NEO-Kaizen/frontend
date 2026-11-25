import type { SessionUser } from '$lib/types/auth';
import { SELF_SERVICE_KEYS } from '$lib/types/permission';
import type { Permission, PermissionCustody, PermissionKey } from '$lib/types/permission';
import type {
	Profile,
	ProfileCreateInput,
	ProfileKeyCatalog,
	ProfileUpdateInput
} from '$lib/types/profile';
import { canGrantCustody } from '$lib/utils/permission-checks';
import { PROFILE_DESCRIPTION_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH } from '$lib/utils/validations';
import { permissionDescription, permissionLabel, resourceLabel } from './permission-ui';

export type ProfileEditorMode = 'create' | 'edit' | 'duplicate';

export type AssignableFlag = 'isAssignableTriage' | 'isAssignableMapping';

export type SelfServiceKey = (typeof SELF_SERVICE_KEYS)[number];

export interface CatalogKey {
	key: PermissionKey;
	label: string;
	description: string;
	fixedCustody: PermissionCustody | null;
	custodies: PermissionCustody[];
	dependencies: PermissionKey[];
}

export interface CatalogResource {
	id: string;
	label: string;
	keys: CatalogKey[];
}

export interface MissingDependency {
	key: PermissionKey;
	dependency: PermissionKey;
}

export interface PermissionSelection {
	selectedKeys: readonly PermissionKey[];
	selectedCustodies: Partial<Record<PermissionKey, PermissionCustody>>;
	currentPermissions: readonly Permission[];
	user: SessionUser;
	catalog: ProfileKeyCatalog;
}

export interface ProfileFormValidationInput {
	mode: ProfileEditorMode;
	name: string;
	description: string;
	canEditComposition: boolean;
	missingDependencies: readonly MissingDependency[];
	isAssignableTriage: boolean;
	isAssignableMapping: boolean;
	hasAssignedCustody: boolean;
	triageRequirementsMet: boolean;
	mappingRequirementsMet: boolean;
	unconfirmedSelfServiceKeys: readonly PermissionKey[];
}

export interface ProfileFormValidation {
	nameError: string;
	saveError: string;
}

export interface ProfileUpdatePayloadInput {
	profile: Profile | null;
	name: string;
	description: string;
	permissions: Permission[];
	compositionChanged: boolean;
	canEditComposition: boolean;
	isAssignableTriage: boolean;
	isAssignableMapping: boolean;
}

const SELF_SERVICE_KEY_SET = new Set<string>(SELF_SERVICE_KEYS);

export const SELF_SERVICE_CONSEQUENCES: Record<SelfServiceKey, string> = {
	'request:create': 'a pessoa perderá a capacidade de abrir novas solicitações.',
	'request:track': 'a pessoa perderá a capacidade de acompanhar as próprias solicitações.',
	'pending_item:respond': 'a pessoa não poderá responder a pedidos de informação pendente.'
};

export function isSelfServiceKey(key: PermissionKey): key is SelfServiceKey {
	return SELF_SERVICE_KEY_SET.has(key);
}

export function duplicateProfileName(value: string): string {
	const suffix = ' (cópia)';
	return `${value.trim().slice(0, PROFILE_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
}

export function groupCatalogResources(catalog: ProfileKeyCatalog): CatalogResource[] {
	const grouped: Record<string, CatalogKey[]> = {};
	for (const definition of catalog.permissions) {
		const resource = definition.key.split(':')[0] || 'permissions';
		const allowedCustodies = definition.allowedCustodies;
		const fixedCustody =
			definition.custodyType === 'global'
				? 'global'
				: allowedCustodies.length === 1
					? (allowedCustodies[0] ?? null)
					: null;
		const normalized: CatalogKey = {
			key: definition.key,
			label: permissionLabel(definition.key),
			description: definition.description?.trim() || permissionDescription(definition.key),
			fixedCustody,
			custodies: [...allowedCustodies],
			dependencies: [...definition.dependencies]
		};
		grouped[resource] = [...(grouped[resource] ?? []), normalized];
	}
	return Object.entries(grouped).map(([id, keys]) => ({
		id,
		label: resourceLabel(id),
		keys
	}));
}

export function grantableCustodies(
	user: SessionUser,
	key: PermissionKey,
	catalog: ProfileKeyCatalog
): PermissionCustody[] {
	const entry = catalog.permissions.find((definition) => definition.key === key);
	const allowedCustodies = entry?.allowedCustodies ?? [];
	return allowedCustodies.filter((custody) =>
		user.permissions.some(
			(permission) => permission.key === key && canGrantCustody(permission.custody, custody)
		)
	);
}

export function actorCanGrant(
	user: SessionUser,
	key: PermissionKey,
	custody: PermissionCustody | undefined,
	catalog: ProfileKeyCatalog
): boolean {
	const availableCustodies = grantableCustodies(user, key, catalog);
	return custody ? availableCustodies.includes(custody) : availableCustodies.length > 0;
}

export function findMissingDependencies(
	catalogKeys: readonly CatalogKey[],
	selectedKeys: readonly PermissionKey[]
): MissingDependency[] {
	return catalogKeys.flatMap((entry) =>
		selectedKeys.includes(entry.key)
			? entry.dependencies
					.filter((dependency) => !selectedKeys.includes(dependency))
					.map((dependency) => ({ key: entry.key, dependency }))
			: []
	);
}

/**
 * Fechamento transitivo das dependências, na ordem do catálogo. Usado quando
 * uma chave é marcada: a UI inclui as dependências em vez de exigir marcação
 * manual.
 */
export function expandWithDependencies(
	selectedKeys: readonly PermissionKey[],
	catalogKeys: readonly CatalogKey[]
): PermissionKey[] {
	const dependenciesByKey = new Map<PermissionKey, readonly PermissionKey[]>(
		catalogKeys.map((entry) => [entry.key, entry.dependencies])
	);

	const selected = new Set<PermissionKey>(selectedKeys);
	const pending = [...selectedKeys];

	while (pending.length > 0) {
		const key = pending.pop();
		if (!key) continue;
		for (const dependency of dependenciesByKey.get(key) ?? []) {
			if (selected.has(dependency)) continue;
			selected.add(dependency);
			pending.push(dependency);
		}
	}

	const ordered = catalogKeys.filter((entry) => selected.has(entry.key)).map((entry) => entry.key);
	const known = new Set(ordered);

	return [...ordered, ...[...selected].filter((key) => !known.has(key))];
}

/** Chaves selecionadas que exigem `key` — a remoção de `key` fica bloqueada. */
export function dependentsOf(
	key: PermissionKey,
	selectedKeys: readonly PermissionKey[],
	catalogKeys: readonly CatalogKey[]
): PermissionKey[] {
	return catalogKeys
		.filter((entry) => selectedKeys.includes(entry.key) && entry.dependencies.includes(key))
		.map((entry) => entry.key);
}

/**
 * Dependências de `key` que o ator não pode conceder. Sem isso, marcar a chave
 * geraria uma composição que o próprio ator não consegue salvar.
 */
export function ungrantableDependencies(
	user: SessionUser,
	key: PermissionKey,
	catalog: ProfileKeyCatalog
): PermissionKey[] {
	const catalogKeys = groupCatalogResources(catalog).flatMap((resource) => resource.keys);
	return expandWithDependencies([key], catalogKeys)
		.filter((dependency) => dependency !== key)
		.filter((dependency) => grantableCustodies(user, dependency, catalog).length === 0);
}

export function flagRequirementsMet(
	catalog: ProfileKeyCatalog,
	selectedKeys: readonly PermissionKey[],
	flag: AssignableFlag
): boolean {
	const requirements =
		flag === 'isAssignableTriage'
			? catalog.assignabilityPredicates.triage
			: catalog.assignabilityPredicates.mapping;
	return requirements.every((key) => selectedKeys.includes(key));
}

export function buildPermissions({
	selectedKeys,
	selectedCustodies,
	currentPermissions,
	user,
	catalog
}: PermissionSelection): Permission[] {
	const catalogKeys = groupCatalogResources(catalog).flatMap((resource) => resource.keys);
	return selectedKeys.map((key) => {
		const current = currentPermissions.find((permission) => permission.key === key);
		const entry = catalogKeys.find((item) => item.key === key);
		const custody: PermissionCustody =
			(Object.hasOwn(selectedCustodies, key) ? selectedCustodies[key] : current?.custody) ??
			entry?.fixedCustody ??
			grantableCustodies(user, key, catalog)[0] ??
			'global';
		return { key, custody };
	});
}

export function permissionSignature(permissions: readonly Permission[]): string {
	return permissions
		.map((permission) => `${permission.key}:${permission.custody}`)
		.sort()
		.join('|');
}

/**
 * Compara duas composições como conjunto (`key:custody`), ignorando ordem.
 * Usado pelo editor e pela reconciliação do `load`.
 */
export function sameComposition(
	current: readonly Permission[],
	saved: readonly Permission[]
): boolean {
	return permissionSignature(current) === permissionSignature(saved);
}

export function validateProfileForm(input: ProfileFormValidationInput): ProfileFormValidation {
	let nameError = '';
	let saveError = '';
	if (!input.name.trim()) nameError = 'Informe o nome do perfil.';
	else if (input.name.trim().length > PROFILE_NAME_MAX_LENGTH) {
		nameError = `O nome deve ter no máximo ${PROFILE_NAME_MAX_LENGTH} caracteres.`;
	}
	if (input.description.trim().length > PROFILE_DESCRIPTION_MAX_LENGTH) {
		saveError = `A descrição deve ter no máximo ${PROFILE_DESCRIPTION_MAX_LENGTH} caracteres.`;
	} else if (input.mode !== 'duplicate') {
		const triageBlocked = input.isAssignableTriage && !input.triageRequirementsMet;
		const mappingBlocked = input.isAssignableMapping && !input.mappingRequirementsMet;
		if (input.canEditComposition && input.missingDependencies.length > 0) {
			saveError = 'Resolva as dependências faltantes antes de salvar.';
		} else if (input.canEditComposition && (triageBlocked || mappingBlocked)) {
			const blockedFlags = [
				triageBlocked ? 'triagem' : null,
				mappingBlocked ? 'mapeamento' : null
			].filter(Boolean);
			saveError = `Desligue a flag de ${blockedFlags.join(' e ')} para remover as chaves que ela exige, tudo na mesma edição.`;
		} else if (input.canEditComposition && input.unconfirmedSelfServiceKeys.length > 0) {
			saveError = 'Confirme as consequências de remover as permissões de autoatendimento.';
		} else if (
			input.hasAssignedCustody &&
			!input.isAssignableTriage &&
			!input.isAssignableMapping
		) {
			saveError =
				'O escopo “Atribuído” exige que o perfil seja atribuível à triagem ou ao mapeamento. Ligue uma das flags e inclua as chaves exigidas, ou troque o escopo para “Todas”.';
		}
	}
	return { nameError, saveError };
}

export function createProfilePayload(input: {
	name: string;
	description: string;
	permissions: Permission[];
	isAssignableTriage: boolean;
	isAssignableMapping: boolean;
}): ProfileCreateInput {
	return {
		name: input.name.trim(),
		description: input.description.trim() || undefined,
		permissions: input.permissions,
		isAssignableTriage: input.isAssignableTriage,
		isAssignableMapping: input.isAssignableMapping
	};
}

export function updateProfilePayload({
	profile,
	name,
	description,
	permissions,
	compositionChanged,
	canEditComposition,
	isAssignableTriage,
	isAssignableMapping
}: ProfileUpdatePayloadInput): ProfileUpdateInput {
	const payload: ProfileUpdateInput = {};
	if (name.trim() !== (profile?.name ?? '')) payload.name = name.trim();
	if (description.trim() !== (profile?.description ?? '')) {
		payload.description = description.trim() || null;
	}
	// Composição e flags permanecem juntas no PATCH quando ambas mudam (guarda 6).
	if (compositionChanged && canEditComposition) {
		payload.permissions = permissions;
	}
	if (isAssignableTriage !== (profile?.isAssignableTriage ?? false)) {
		payload.isAssignableTriage = isAssignableTriage;
	}
	if (isAssignableMapping !== (profile?.isAssignableMapping ?? false)) {
		payload.isAssignableMapping = isAssignableMapping;
	}
	return payload;
}
