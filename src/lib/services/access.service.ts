import { redirect } from '@sveltejs/kit';
import type { RouteId } from '$app/types';
import type { SessionUser } from '$lib/types/auth';
import type { UserType } from '$lib/types/user';

const LOGIN_PATH = '/login' as const;
const UNAUTHORIZED_PATH = '/sem-autorizacao' as const;
const CHANGE_PASSWORD_PATH = '/redefinir-senha' as const;
const HOME_PATH = '/' as const;
const DASHBOARD_PATH = '/(admin)/home' as const;

type PostLoginRoute =
	| typeof CHANGE_PASSWORD_PATH
	| typeof DASHBOARD_PATH
	| typeof HOME_PATH;

export type GuardRuleId = 'anySession' | 'internalArea' | 'adminOnly';

const INTERNAL_PROFILES: readonly UserType[] = ['Analista', 'Gestor', 'Administrador'];

const GUARD_RULES: Record<GuardRuleId, { profiles: 'any' | readonly UserType[] }> = {
	anySession: { profiles: 'any' },
	internalArea: { profiles: INTERNAL_PROFILES },
	adminOnly: { profiles: ['Administrador'] }
};

export function guard(rule: GuardRuleId, user: SessionUser | null): void {
	const profiles = GUARD_RULES[rule].profiles;
	if (!user) {
		redirect(303, LOGIN_PATH);
	}
	if (profiles !== 'any' && !profiles.includes(user.role)) {
		redirect(303, UNAUTHORIZED_PATH);
	}
}

export function getHomeRedirect(
	user: SessionUser | null
): Extract<RouteId, '/(admin)/home'> | null {
	if (user && INTERNAL_PROFILES.includes(user.role)) {
		return '/(admin)/home';
	}
	return null;
}

export function isPasswordChangeRequired(user: SessionUser | null): boolean {
	return Boolean(user?.forcePasswordChange);
}

export function isPasswordChangeRoute(pathname: string): boolean {
	return pathname.startsWith(CHANGE_PASSWORD_PATH);
}

export function guardPasswordChange(user: SessionUser | null, pathname: string): void {
	if (user && isPasswordChangeRequired(user) && !isPasswordChangeRoute(pathname)) {
		redirect(303, CHANGE_PASSWORD_PATH);
	}
}

export function getPostLoginRedirect(
	user: SessionUser,
): PostLoginRoute  {
	if (isPasswordChangeRequired(user)) {
		return CHANGE_PASSWORD_PATH;
	}

	if (INTERNAL_PROFILES.includes(user.role)) {
		return DASHBOARD_PATH;
	}

	return HOME_PATH;
}
