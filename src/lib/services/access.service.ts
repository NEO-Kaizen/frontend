import { redirect } from '@sveltejs/kit';
import type { RouteId } from '$app/types';
import type { SessionUser } from '$lib/types/auth';
import type { UserType } from '$lib/types/user';

const LOGIN_PATH = '/login' as const;
const UNAUTHORIZED_PATH = '/sem-autorizacao' as const;
const CHANGE_PASSWORD_PATH = '/redefinir-senha' as const;
const HOME_PATH = '/' as const;
const DASHBOARD_PATH = '/(admin)/home' as const;

type PostLoginRoute = typeof CHANGE_PASSWORD_PATH | typeof DASHBOARD_PATH | typeof HOME_PATH;

export type GuardRuleId = 'anySession' | 'internalArea' | 'managementOnly' | 'adminOnly';

const INTERNAL_PROFILES: readonly UserType[] = ['Analista', 'Gestor', 'Administrador'];

const GUARD_RULES: Record<GuardRuleId, { profiles: 'any' | readonly UserType[] }> = {
	anySession: { profiles: 'any' },
	internalArea: { profiles: INTERNAL_PROFILES },
	managementOnly: { profiles: ['Gestor', 'Administrador'] },
	adminOnly: { profiles: ['Administrador'] }
};

export function isInternalProfile(role: UserType): boolean {
	return INTERNAL_PROFILES.includes(role);
}

// Permissão de edição do conteúdo interno da solicitação (informações e
// mapeamento): Administrador edita qualquer uma; os demais perfis editam
// apenas a solicitação que lhes foi atribuída (responsável). O Gestor
// visualiza em somente leitura porque não é atribuído como responsável.
// A regra vive aqui para nenhum componente precisar de role hardcoded.
export function canEditSolicitation(
	assigneeId: string | null | undefined,
	user: SessionUser | null
): boolean {
	if (!user) return false;
	if (user.role === 'Administrador') return true;
	return Boolean(assigneeId && assigneeId === user.id);
}

export function isProfileAllowed(role: UserType, profiles: 'any' | readonly UserType[]): boolean {
	return profiles === 'any' || profiles.includes(role);
}

export function canAssignAnalyst(user: SessionUser | null): boolean {
	return user?.role === 'Administrador';
}

export function canCalculatePriority(user: SessionUser | null, assigneeId: string | null): boolean {
	if (!user) return false;
	if (user.role === 'Administrador') return true;
	if (user.role === 'Analista' && assigneeId !== null && user.id === assigneeId) return true;
	return false;
}

export function isAllowedReturnTo(value: string): value is PostLoginRoute {
	if (!value.startsWith('/')) return false;
	if (value.includes('://')) return false;
	if (value.startsWith('//')) return false;
	return true;
}

export function guard(rule: GuardRuleId, user: SessionUser | null, pathname?: string): void {
	const profiles = GUARD_RULES[rule].profiles;
	if (!user) {
		const returnUrl =
			pathname && isAllowedReturnTo(pathname)
				? `${LOGIN_PATH}?returnTo=${encodeURIComponent(pathname)}`
				: LOGIN_PATH;
		redirect(303, returnUrl);
	}
	if (!isProfileAllowed(user.role, profiles)) {
		redirect(303, UNAUTHORIZED_PATH);
	}
}

export function redirectToLogin(url: URL, loginUrl: string): never {
	const returnTo = url.pathname + url.search;
	const searchParams = new URLSearchParams({ returnTo });
	redirect(303, `${loginUrl}?${searchParams.toString()}`);
}

export function getHomeRedirect(
	user: SessionUser | null
): Extract<RouteId, '/(admin)/home'> | null {
	if (user && isInternalProfile(user.role)) {
		return '/(admin)/home';
	}
	return null;
}

export function isPasswordChangeRequired(user: SessionUser | null): boolean {
	return Boolean(user?.mustChangePassword);
}

export function isPasswordChangeRoute(pathname: string): boolean {
	return pathname.startsWith(CHANGE_PASSWORD_PATH);
}

export function guardPasswordChange(user: SessionUser | null, pathname: string): void {
	if (user && isPasswordChangeRequired(user) && !isPasswordChangeRoute(pathname)) {
		redirect(303, CHANGE_PASSWORD_PATH);
	}
}

export function getPostLoginRedirect(user: SessionUser, returnTo?: string | null): string {
	if (isPasswordChangeRequired(user)) {
		if (returnTo && isAllowedReturnTo(returnTo)) {
			return `${CHANGE_PASSWORD_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
		}
		return CHANGE_PASSWORD_PATH;
	}

	if (returnTo && isAllowedReturnTo(returnTo)) {
		return returnTo;
	}

	if (INTERNAL_PROFILES.includes(user.role)) {
		return DASHBOARD_PATH;
	}

	return HOME_PATH;
}
