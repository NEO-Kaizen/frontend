import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { RouteId } from '$app/types';
import type { SessionUser } from '$lib/types/auth';
import { OPERATIONAL_AREA_KEYS, PORTAL_READ_KEYS, type PermissionKey } from '$lib/types/permission';
import { has, hasAny } from '$lib/utils/permission-checks';

export { can, has, hasAny } from '$lib/utils/permission-checks';

const LOGIN_PATH = '/login' as const;
const UNAUTHORIZED_PATH = '/sem-autorizacao' as const;
const CHANGE_PASSWORD_PATH = '/redefinir-senha' as const;

type HomeRoute = Extract<
	RouteId,
	| '/(admin)/fila'
	| '/(admin)/dashboard'
	| '/(admin)/usuarios'
	| '/(admin)/configuracoes'
	| '/(public)/acompanhar'
>;

interface HomeRedirect {
	keys: readonly PermissionKey[];
	route: HomeRoute;
}

const HOME_REDIRECTS: readonly HomeRedirect[] = [
	{ keys: ['queue:read'], route: '/(admin)/fila' },
	{ keys: ['reports:read'], route: '/(admin)/dashboard' },
	{ keys: ['user:read'], route: '/(admin)/usuarios' },
	{ keys: PORTAL_READ_KEYS, route: '/(admin)/configuracoes' },
	{ keys: ['request:track'], route: '/(public)/acompanhar' }
];

export const ADMIN_AREA_KEYS: readonly PermissionKey[] = [
	...OPERATIONAL_AREA_KEYS,
	...PORTAL_READ_KEYS
];

function loginRedirectPath(pathname?: string): string {
	if (pathname && isAllowedReturnTo(pathname)) {
		return `${LOGIN_PATH}?returnTo=${encodeURIComponent(pathname)}`;
	}
	return LOGIN_PATH;
}

export function guardSession(user: SessionUser | null, pathname?: string): void {
	if (!user) redirect(303, loginRedirectPath(pathname));
}

export function guard(key: PermissionKey, user: SessionUser | null, pathname?: string): void {
	guardSession(user, pathname);
	if (!has(key, user)) redirect(303, UNAUTHORIZED_PATH);
}

export function guardAny(
	keys: readonly PermissionKey[],
	user: SessionUser | null,
	pathname?: string
): void {
	guardSession(user, pathname);
	if (!hasAny(keys, user)) redirect(303, UNAUTHORIZED_PATH);
}

export function isAllowedReturnTo(value: string): boolean {
	if (!value.startsWith('/')) return false;
	if (value.startsWith('//')) return false;
	if (value.includes('://') || value.includes('\\')) return false;
	if ([...value].some((char) => char.charCodeAt(0) <= 0x1f || char.charCodeAt(0) === 0x7f)) {
		return false;
	}
	return true;
}

export function redirectToLogin(url: URL, loginUrl: string): never {
	const returnTo = url.pathname + url.search;
	const searchParams = new URLSearchParams({ returnTo });
	redirect(303, `${loginUrl}?${searchParams.toString()}`);
}

export function getHomeRedirect(user: SessionUser | null | undefined): HomeRoute | null {
	return HOME_REDIRECTS.find((item) => hasAny(item.keys, user))?.route ?? null;
}

export function getHomePath(user: SessionUser | null | undefined): string | null {
	const home = getHomeRedirect(user);
	return home ? resolve(home) : null;
}

export function isPasswordChangeRequired(user: SessionUser | null | undefined): boolean {
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

	return getHomePath(user) ?? UNAUTHORIZED_PATH;
}
