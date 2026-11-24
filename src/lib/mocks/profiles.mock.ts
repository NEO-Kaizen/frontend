import { getMockSessionUser } from '$lib/mocks/auth.mock';
import { ApiError } from '$lib/types/result';
import {
	GLOBAL_PERMISSION_KEYS,
	PERMISSION_CUSTODIES,
	PERMISSION_KEYS,
	SELF_SERVICE_KEYS,
	type Permission,
	type PermissionCustody,
	type PermissionKey
} from '$lib/types/permission';
import type {
	DuplicateProfileInput,
	Profile,
	ProfileCreateInput,
	ProfileKeyCatalog,
	ProfilePermissionInput,
	ProfileStatusResponse,
	ProfileUpdateInput
} from '$lib/types/profile';
import type { SessionUser } from '$lib/types/auth';
import { canGrantCustody, has, isRootActor } from '$lib/utils/permission-checks';
import { PROFILE_NAME_MAX_LENGTH } from '$lib/utils/validations';

const MOCK_LATENCY_MS = 180;

const profileCatalog: ProfileKeyCatalog = {
	permissions: PERMISSION_KEYS.map((key) => ({
		key,
		custodyType: (GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)
			? 'global'
			: 'custodial',
		allowedCustodies: allowedCustodiesFor(key),
		dependencies: dependenciesFor(key)
	})),
	assignabilityPredicates: {
		triage: ['request:read', 'triage:read', 'triage:write'],
		mapping: ['request:read', 'mapping:read', 'mapping:write']
	}
};

function buildPermissions(
	entries: Partial<Record<PermissionCustody, readonly PermissionKey[]>>
): Permission[] {
	const custodyByKey = new Map<PermissionKey, PermissionCustody>();

	for (const custody of PERMISSION_CUSTODIES) {
		for (const key of entries[custody] ?? []) custodyByKey.set(key, custody);
	}

	return PERMISSION_KEYS.filter((key) => custodyByKey.has(key)).map((key) => ({
		key,
		custody: custodyByKey.get(key) as PermissionCustody
	}));
}

const ALL_PERMISSIONS: Permission[] = PERMISSION_KEYS.map((key) => ({
	key,
	custody:
		key === 'request:track' || key === 'pending_item:respond'
			? 'own'
			: (GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)
				? 'global'
				: 'all'
}));

const SELF_SERVICE_PERMISSIONS = buildPermissions({
	global: ['request:create'],
	own: ['request:track', 'pending_item:respond']
});

const ANALYST_PERMISSIONS = buildPermissions({
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

const MANAGER_PERMISSIONS = buildPermissions({
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
		'audit:read'
	]
});

const COORDINATOR_PERMISSIONS = buildPermissions({
	assigned: ['request:read', 'queue:read', 'triage:read', 'pending_item:read']
});

const profileRecords: Profile[] = [
	{
		id: '1',
		name: 'Solicitante',
		description: 'Acesso às próprias solicitações e pendências.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 12,
		permissions: SELF_SERVICE_PERMISSIONS
	},
	{
		id: '2',
		name: 'Analista',
		description: 'Atendimento das solicitações atribuídas.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: true,
		isAssignableMapping: true,
		userCount: 7,
		permissions: ANALYST_PERMISSIONS
	},
	{
		id: '3',
		name: 'Gestor',
		description: 'Acompanhamento das solicitações e indicadores.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 2,
		permissions: MANAGER_PERMISSIONS
	},
	{
		id: '4',
		name: 'Administrador',
		description: 'Administração de usuários e configurações.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 2,
		permissions: ALL_PERMISSIONS
	},
	{
		id: '5',
		name: 'Admin Root',
		description: 'Perfil raiz com acesso irrestrito.',
		isActive: true,
		isRoot: true,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 0,
		permissions: ALL_PERMISSIONS
	},
	{
		id: '6',
		name: 'Coordenador',
		description: 'Perfil customizado de acompanhamento da fila.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 0,
		permissions: COORDINATOR_PERMISSIONS
	},
	{
		id: '7',
		name: 'Perfil Inativo',
		description: null,
		isActive: false,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 0,
		permissions: []
	}
];

let nextProfileId = 8;

export function listProfilesMock(): Profile[] {
	return structuredClone(profileRecords);
}

export function getProfileKeyCatalogMock(): ProfileKeyCatalog {
	return structuredClone(profileCatalog);
}

export async function createProfileMock(payload: ProfileCreateInput): Promise<Profile> {
	const actor = await requireManagePermission();
	const name = normalizeName(payload.name);
	assertNameAvailable(name);
	const permissions = validateComposition(payload.permissions);
	assertNoEscalation(permissions, actor.permissions);

	const profile: Profile = {
		id: String(nextProfileId++),
		name,
		description: payload.description?.trim() || null,
		isActive: true,
		isRoot: false,
		isAssignableTriage: payload.isAssignableTriage ?? false,
		isAssignableMapping: payload.isAssignableMapping ?? false,
		userCount: 0,
		permissions
	};
	validateAssignability(profile);
	profileRecords.push(profile);

	return delay().then(() => structuredClone(profile));
}

export async function updateProfileMock(id: string, payload: ProfileUpdateInput): Promise<Profile> {
	const actor = await requireManagePermission();
	const current = findProfile(id);

	if (current.isRoot && !isRootActor(actor)) {
		throw new ApiError(403, 'Apenas o Admin Root edita o perfil Admin Root.');
	}

	const nextPermissions =
		payload.permissions === undefined
			? current.permissions
			: validateComposition(payload.permissions);
	if (payload.permissions !== undefined) assertNoEscalation(nextPermissions, actor.permissions);

	const next: Profile = {
		...current,
		...(payload.name !== undefined ? { name: normalizeName(payload.name) } : {}),
		...(payload.description !== undefined
			? { description: payload.description?.trim() || null }
			: {}),
		...(payload.isAssignableTriage !== undefined
			? { isAssignableTriage: payload.isAssignableTriage }
			: {}),
		...(payload.isAssignableMapping !== undefined
			? { isAssignableMapping: payload.isAssignableMapping }
			: {}),
		...(payload.permissions !== undefined ? { permissions: nextPermissions } : {})
	};

	if (next.name !== current.name) assertNameAvailable(next.name, id);
	if (current.isRoot) {
		if (!next.permissions.some((permission) => permission.key === 'profile:manage')) {
			throw new ApiError(400, 'O perfil Admin Root não pode perder profile:manage.');
		}
		if (next.isAssignableTriage || next.isAssignableMapping) {
			throw new ApiError(400, 'O perfil Admin Root não é atribuível.');
		}
	}
	assertWorkKeyGuard(current, next, payload);
	validateAssignability(next);
	Object.assign(current, next);

	return delay().then(() => structuredClone(current));
}

export async function changeProfileStatusMock(
	id: string,
	isActive: boolean
): Promise<ProfileStatusResponse> {
	await requireManagePermission();
	const profile = findProfile(id);

	if (profile.isRoot && !isActive) {
		throw new ApiError(400, 'O perfil Admin Root não pode ser desativado.');
	}
	if (!isActive && profile.userCount > 0) {
		throw new ApiError(
			400,
			`O perfil tem ${profile.userCount} conta(s) vinculada(s). Realoque as contas para outro perfil antes de desativá-lo.`
		);
	}
	if (isActive) assertNameAvailable(profile.name, id);

	profile.isActive = isActive;
	return delay().then(() => ({ id: profile.id, isActive }));
}

export async function duplicateProfileMock(
	id: string,
	payload: DuplicateProfileInput
): Promise<Profile> {
	await requireManagePermission();
	const source = findProfile(id);
	return createProfileMock({
		name: payload.name,
		description: payload.description ?? source.description,
		isAssignableTriage: source.isAssignableTriage,
		isAssignableMapping: source.isAssignableMapping,
		permissions: source.permissions
	});
}

async function requireManagePermission(): Promise<SessionUser> {
	const user = getMockSessionUser();
	if (!user || !has('profile:manage', user)) {
		throw new ApiError(403, 'Você não tem permissão para gerenciar perfis.');
	}
	return user;
}

function findProfile(id: string): Profile {
	const profile = profileRecords.find((item) => item.id === id);
	if (!profile) throw new ApiError(404, 'Perfil não encontrado.');
	return profile;
}

function normalizeName(value: string): string {
	const name = value.trim();
	if (!name || name.length > PROFILE_NAME_MAX_LENGTH) {
		throw new ApiError(400, `Informe um nome de até ${PROFILE_NAME_MAX_LENGTH} caracteres.`);
	}
	return name;
}

function assertNameAvailable(name: string, excludeId?: string): void {
	const match = profileRecords.find(
		(profile) =>
			profile.id !== excludeId &&
			profile.isActive &&
			profile.name.toLowerCase() === name.toLowerCase()
	);
	if (match) throw new ApiError(400, `Já existe um perfil ativo com o nome "${match.name}".`);
}

function validateComposition(input: readonly ProfilePermissionInput[]): Permission[] {
	const unique = new Map<PermissionKey, PermissionCustody>();
	for (const grant of input) {
		const definition = profileCatalog.permissions.find((item) => item.key === grant.key);
		if (!definition) throw new ApiError(400, `Chave de permissão desconhecida: ${grant.key}.`);
		if (!definition.allowedCustodies.includes(grant.custody)) {
			throw new ApiError(
				400,
				`O vínculo '${grant.custody}' não é permitido para a chave ${grant.key}.`
			);
		}
		if (unique.has(grant.key))
			throw new ApiError(400, `A chave ${grant.key} aparece mais de uma vez.`);
		unique.set(grant.key, grant.custody);
	}
	for (const grant of input) {
		const definition = profileCatalog.permissions.find((item) => item.key === grant.key);
		for (const dependency of definition?.dependencies ?? []) {
			if (!unique.has(dependency)) {
				throw new ApiError(400, `A chave ${grant.key} exige também ${dependency}.`);
			}
		}
	}
	return PERMISSION_KEYS.filter((key) => unique.has(key)).map((key) => ({
		key,
		custody: unique.get(key) as PermissionCustody
	}));
}

function assertNoEscalation(
	requested: readonly Permission[],
	actorPermissions: readonly Permission[]
): void {
	const actorCustody = new Map(
		actorPermissions.map((permission) => [permission.key, permission.custody])
	);
	for (const permission of requested) {
		const custody = actorCustody.get(permission.key);
		if (!canGrantCustody(custody, permission.custody)) {
			throw new ApiError(
				400,
				custody
					? `Você não pode conceder ${permission.key} em '${permission.custody}': o seu vínculo é '${custody}'.`
					: `Você não pode conceder a chave ${permission.key}, que não possui.`
			);
		}
	}
}

function validateAssignability(profile: Profile): void {
	for (const stage of ['triage', 'mapping'] as const) {
		const enabled = stage === 'triage' ? profile.isAssignableTriage : profile.isAssignableMapping;
		if (!enabled) continue;
		const missing = profileCatalog.assignabilityPredicates[stage].filter(
			(key) => !profile.permissions.some((permission) => permission.key === key)
		);
		if (missing.length) {
			throw new ApiError(
				400,
				`O perfil não pode ser atribuível em ${stage === 'triage' ? 'triagem' : 'mapeamento'} sem as chaves ${missing.join(', ')}.`
			);
		}
	}
}

function assertWorkKeyGuard(current: Profile, next: Profile, payload: ProfileUpdateInput): void {
	for (const stage of ['triage', 'mapping'] as const) {
		const predicate = profileCatalog.assignabilityPredicates[stage];
		const currentHasPredicate = predicate.every((key) =>
			current.permissions.some((permission) => permission.key === key)
		);
		const missing = predicate.filter(
			(key) => !next.permissions.some((permission) => permission.key === key)
		);
		if (!currentHasPredicate || missing.length === 0) continue;

		const flag = stage === 'triage' ? 'isAssignableTriage' : 'isAssignableMapping';
		const nextFlag = next[flag];
		if (nextFlag) {
			throw new ApiError(
				400,
				`Remover as chaves ${missing.join(', ')} manteria o perfil atribuível em ${stage === 'triage' ? 'triagem' : 'mapeamento'}. Desligue a flag correspondente na mesma chamada.`
			);
		}
		if (current[flag] && payload[flag] !== false) {
			throw new ApiError(
				400,
				`Desligue a flag de ${stage === 'triage' ? 'triagem' : 'mapeamento'} e remova as chaves na mesma edição.`
			);
		}
	}
}

function allowedCustodiesFor(key: PermissionKey): PermissionCustody[] {
	if ((GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)) return ['global'];
	if ((SELF_SERVICE_KEYS as readonly string[]).includes(key)) return ['own'];
	return ['assigned', 'all'];
}

function dependenciesFor(key: PermissionKey): PermissionKey[] {
	if (key.endsWith(':manage')) return [key.replace(/:manage$/, ':read') as PermissionKey];
	if (key === 'request:write') return ['request:read'];
	if (key === 'request:status_override') return ['request:status_change'];
	if (key === 'pending_item:respond') return ['request:track'];
	return [];
}

function delay(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
