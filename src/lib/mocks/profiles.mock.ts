import type { Profile } from '$lib/types/profile';
import {
	GLOBAL_PERMISSION_KEYS,
	PERMISSION_CUSTODIES,
	PERMISSION_KEYS,
	type Permission,
	type PermissionCustody,
	type PermissionKey
} from '$lib/types/permission';

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

const PROFILES: Profile[] = [
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

export function listProfilesMock(): Profile[] {
	return structuredClone(PROFILES);
}
