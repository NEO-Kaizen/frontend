import { getMockSessionUser } from '$lib/mocks/auth.mock';
import { ApiError } from '$lib/types/result';
import {
	GLOBAL_PERMISSION_KEYS,
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
import { has } from '$lib/utils/permission-checks';

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

const profileRecords: Profile[] = [
	{
		id: '1',
		name: 'Solicitante',
		description: 'Abertura e acompanhamento das próprias solicitações.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 8,
		permissions: permissionsFor(['request:create', 'request:track', 'pending_item:respond'])
	},
	{
		id: '2',
		name: 'Analista',
		description: 'Atuação operacional nas solicitações atribuídas.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: true,
		isAssignableMapping: true,
		userCount: 4,
		permissions: permissionsFor(
			[
				'request:create',
				'request:track',
				'request:read',
				'request:write',
				'request:assign',
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
				'pending_item:respond',
				'internal_note:read',
				'internal_note:write',
				'audit:read',
				'assignee_directory:read'
			],
			'assigned'
		)
	},
	{
		id: '3',
		name: 'Gestor',
		description: 'Leitura operacional de todas as solicitações.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 2,
		permissions: permissionsFor([
			'request:create',
			'request:track',
			'request:read',
			'queue:read',
			'queue:export',
			'reports:read',
			'triage:read',
			'mapping:read',
			'pending_item:read',
			'pending_item:respond',
			'internal_note:read',
			'internal_note:write',
			'audit:read',
			'assignee_directory:read'
		])
	},
	{
		id: '4',
		name: 'Administrador',
		description: 'Gestão de usuários, perfis e configurações.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 1,
		permissions: allPermissionsFor('all')
	},
	{
		id: '5',
		name: 'Admin Root',
		description: 'Perfil protegido de administração raiz.',
		isActive: true,
		isRoot: true,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 1,
		permissions: allPermissionsFor('all')
	},
	{
		id: '6',
		name: 'Auditor de exemplo',
		description: 'Perfil customizado demonstrativo, com acesso de leitura.',
		isActive: true,
		isRoot: false,
		isAssignableTriage: false,
		isAssignableMapping: false,
		userCount: 0,
		permissions: permissionsFor(['request:read', 'queue:read', 'reports:read', 'audit:read'])
	}
];

let nextProfileId = 7;

export async function listProfilesMock(): Promise<Profile[]> {
	await requirePermission('profile:read');
	return delay().then(() => structuredClone(profileRecords));
}

export async function getProfileKeyCatalogMock(): Promise<ProfileKeyCatalog> {
	await requirePermission('profile:read');
	return delay().then(() => structuredClone(profileCatalog));
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
	const isRootActor = actor.id === '5';

	if (current.isRoot && !isRootActor) {
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

async function requireManagePermission() {
	return requirePermission('profile:manage');
}

async function requirePermission(key: 'profile:read' | 'profile:manage') {
	const user = getMockSessionUser();
	if (!has(key, user)) {
		throw new ApiError(
			403,
			key === 'profile:read'
				? 'Você não tem permissão para consultar perfis.'
				: 'Você não tem permissão para gerenciar perfis.'
		);
	}
	return user!;
}

function findProfile(id: string): Profile {
	const profile = profileRecords.find((item) => item.id === id);
	if (!profile) throw new ApiError(404, 'Perfil não encontrado.');
	return profile;
}

function normalizeName(value: string): string {
	const name = value.trim();
	if (!name || name.length > 60) throw new ApiError(400, 'Informe um nome de até 60 caracteres.');
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
		const allowed =
			custody === permission.custody || (custody === 'all' && permission.custody === 'assigned');
		if (!allowed) {
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

function permissionsFor(
	keys: readonly PermissionKey[],
	defaultCustody: 'assigned' | 'all' = 'all'
): Permission[] {
	return PERMISSION_KEYS.filter((key) => keys.includes(key)).map((key) => ({
		key,
		custody: (GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)
			? 'global'
			: (SELF_SERVICE_KEYS as readonly string[]).includes(key)
				? 'own'
				: defaultCustody
	}));
}

function allPermissionsFor(custody: 'all'): Permission[] {
	return PERMISSION_KEYS.map((key) => ({
		key,
		custody: (GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)
			? 'global'
			: (SELF_SERVICE_KEYS as readonly string[]).includes(key)
				? 'own'
				: custody
	}));
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
