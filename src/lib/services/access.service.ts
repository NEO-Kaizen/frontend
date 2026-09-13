import { redirect } from '@sveltejs/kit';
import type { RouteId } from '$app/types';
import type { SessionUser } from '$lib/types/auth';
import type { UserType } from '$lib/types/user';

const LOGIN_PATH = '/login';
const UNAUTHORIZED_PATH = '/sem-autorizacao';

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
	if (user && isInternalProfile(user.role)) {
		return '/(admin)/home';
	}
	return null;
}
