import type { PermissionCustody } from '$lib/types/permission';

/** Rótulos de custódia usados na tabela e no editor de perfis. */
export const custodyLabels: Record<PermissionCustody, string> = {
	global: 'Global',
	own: 'Próprio',
	assigned: 'Atribuído',
	all: 'Todos'
};
