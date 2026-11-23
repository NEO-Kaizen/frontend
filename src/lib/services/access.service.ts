import { redirect } from '@sveltejs/kit';
import type { RouteId } from '$app/types';
import type { SessionUser } from '$lib/types/auth';
import {
	OPERATIONAL_AREA_KEYS,
	PORTAL_READ_KEYS,
	type PermissionCustody,
	type PermissionKey
} from '$lib/types/permission';

const LOGIN_PATH = '/login' as const;
const UNAUTHORIZED_PATH = '/sem-autorizacao' as const;
const CHANGE_PASSWORD_PATH = '/redefinir-senha' as const;
const QUEUE_PATH = '/fila' as const;
const DASHBOARD_PATH = '/dashboard' as const;
const USERS_PATH = '/usuarios' as const;
const SETTINGS_PATH = '/configuracoes' as const;
const TRACK_PATH = '/acompanhar' as const;

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
	path: string;
}

const HOME_REDIRECTS: readonly HomeRedirect[] = [
	{ keys: ['queue:read'], route: '/(admin)/fila', path: QUEUE_PATH },
	{ keys: ['reports:read'], route: '/(admin)/dashboard', path: DASHBOARD_PATH },
	{ keys: ['user:read'], route: '/(admin)/usuarios', path: USERS_PATH },
	{ keys: PORTAL_READ_KEYS, route: '/(admin)/configuracoes', path: SETTINGS_PATH },
	{ keys: ['request:track'], route: '/(public)/acompanhar', path: TRACK_PATH }
];

export const ADMIN_AREA_KEYS: readonly PermissionKey[] = [
	...OPERATIONAL_AREA_KEYS,
	...PORTAL_READ_KEYS
];

const CUSTODY_CONTAINS: Record<PermissionCustody, readonly PermissionCustody[]> = {
	global: ['global'],
	own: ['own'],
	assigned: ['assigned', 'all'],
	all: ['all']
};

export function has(key: PermissionKey, user: SessionUser | null | undefined): boolean {
	return Boolean(user?.permissions.some((permission) => permission.key === key));
}

export function hasAny(
	keys: readonly PermissionKey[],
	user: SessionUser | null | undefined
): boolean {
	return keys.some((key) => has(key, user));
}

export function can(
	key: PermissionKey,
	custody: PermissionCustody,
	user: SessionUser | null | undefined
): boolean {
	const accepted = CUSTODY_CONTAINS[custody];
	return Boolean(
		user?.permissions.some(
			(permission) => permission.key === key && accepted.includes(permission.custody)
		)
	);
}

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
	return HOME_REDIRECTS.find((item) => hasAny(item.keys, user))?.path ?? null;
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
