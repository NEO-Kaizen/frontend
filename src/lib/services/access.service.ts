import { base, resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import type { SessionUser } from '$lib/types/auth';
import type { UserType } from '$lib/types/user';

const LOGIN_ROUTE = '/(public)/login' as const;
const UNAUTHORIZED_ROUTE = '/(public)/sem-autorizacao' as const;
const CHANGE_PASSWORD_ROUTE = '/(app)/redefinir-senha' as const;
const CHANGE_PASSWORD_PATH = '/redefinir-senha' as const;
const HOME_ROUTE = '/' as const;
const DASHBOARD_ROUTE = '/(admin)/home' as const;

export type GuardRuleId = 'anySession' | 'internalArea' | 'adminOnly';

const INTERNAL_PROFILES: readonly UserType[] = ['Analista', 'Gestor', 'Administrador'];

const GUARD_RULES: Record<GuardRuleId, { profiles: 'any' | readonly UserType[] }> = {
	anySession: { profiles: 'any' },
	internalArea: { profiles: INTERNAL_PROFILES },
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

export function isAllowedReturnTo(value: string): boolean {
	try {
		const url = new URL(value, 'http://internal');
		const isSameOrigin = url.origin === 'http://internal';
		const isInsideApp = !base || url.pathname === base || url.pathname.startsWith(`${base}/`);

		return value.startsWith('/') && isSameOrigin && isInsideApp;
	} catch {
		return false;
	}
}

function appendReturnTo(destination: string, returnTo?: string | null): string {
	if (!returnTo || !isAllowedReturnTo(returnTo)) return destination;

	const searchParams = new URLSearchParams({ returnTo });
	return `${destination}?${searchParams.toString()}`;
}

export function guard(rule: GuardRuleId, user: SessionUser | null, url?: URL): void {
	const profiles = GUARD_RULES[rule].profiles;
	if (!user) {
		const returnTo = url ? url.pathname + url.search : null;
		redirect(303, appendReturnTo(resolve(LOGIN_ROUTE), returnTo));
	}
	if (!isProfileAllowed(user.role, profiles)) {
		redirect(303, resolve(UNAUTHORIZED_ROUTE));
	}
}

export function redirectToLogin(url: URL): never {
	const returnTo = url.pathname + url.search;
	redirect(303, appendReturnTo(resolve(LOGIN_ROUTE), returnTo));
}

export function getHomeRedirect(user: SessionUser | null): string | null {
	if (user && isInternalProfile(user.role)) {
		return resolve(DASHBOARD_ROUTE);
	}
	return null;
}

export function isPasswordChangeRequired(user: SessionUser | null): boolean {
	return Boolean(user?.mustChangePassword);
}

export function isPasswordChangeRoute(pathname: string): boolean {
	const changePasswordPath = `${base}${CHANGE_PASSWORD_PATH}`;

	return pathname === changePasswordPath || pathname.startsWith(`${changePasswordPath}/`);
}

export function guardPasswordChange(user: SessionUser | null, url: URL): void {
	if (user && isPasswordChangeRequired(user) && !isPasswordChangeRoute(url.pathname)) {
		const returnTo = url.pathname + url.search;
		redirect(303, appendReturnTo(resolve(CHANGE_PASSWORD_ROUTE), returnTo));
	}
}

export function getPostLoginRedirect(user: SessionUser, returnTo?: string | null): string {
	if (isPasswordChangeRequired(user)) {
		return appendReturnTo(resolve(CHANGE_PASSWORD_ROUTE), returnTo);
	}

	if (returnTo && isAllowedReturnTo(returnTo)) {
		return returnTo;
	}

	if (INTERNAL_PROFILES.includes(user.role)) {
		return resolve(DASHBOARD_ROUTE);
	}

	return resolve(HOME_ROUTE);
}
