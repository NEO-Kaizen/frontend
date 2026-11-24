import type { Profile } from '$lib/types/profile';
import {
	ALL_PERMISSIONS,
	ANALYST_PERMISSIONS,
	buildProfilePermissions,
	MANAGER_PERMISSIONS,
	SELF_SERVICE_PERMISSIONS
} from './profile-permissions.mock';

const COORDINATOR_PERMISSIONS = buildProfilePermissions({
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
		userCount: 11,
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
		userCount: 1,
		permissions: SELF_SERVICE_PERMISSIONS
	}
];

export function listProfilesMock(): Profile[] {
	return structuredClone(PROFILES);
}
