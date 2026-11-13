import type { UserProfile, UserType } from '$lib/types/user';

// Rótulos de exibição do perfil de usuário. O valor de domínio permanece
// `Gestor` (contrato backend); apenas a renderização usa "Visualizador".
const ROLE_DISPLAY_LABELS: Record<string, string> = {
	solicitante: 'Solicitante',
	analista: 'Analista',
	administrador: 'Administrador',
	gestor: 'Visualizador'
};

export function getRoleDisplayLabel(role?: UserType | UserProfile | null): string {
	if (!role) return '';
	return ROLE_DISPLAY_LABELS[role.toLowerCase()] ?? role;
}

export function getInitials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join('');
}
