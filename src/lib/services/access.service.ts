import { base, resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import type { RouteId } from '$app/types';
import type { SessionUser } from '$lib/types/auth';
import {
	OPERATIONAL_AREA_KEYS,
	PORTAL_ACCESS_KEYS,
	type PermissionKey
} from '$lib/types/permission';
import { has, hasAny } from '$lib/utils/permission-checks';

export { can, has, hasAny } from '$lib/utils/permission-checks';

const LOGIN_ROUTE = '/(public)/login' as const;
const UNAUTHORIZED_ROUTE = '/(public)/sem-autorizacao' as const;
const CHANGE_PASSWORD_ROUTE = '/(app)/redefinir-senha' as const;
const CHANGE_PASSWORD_PATH = '/redefinir-senha' as const;
const UNAUTHORIZED_PATH = '/sem-autorizacao' as const;
const RETURN_TO_IGNORED_ROUTES: Set<string> = new Set([
	resolve(LOGIN_ROUTE),
	resolve(UNAUTHORIZED_ROUTE)
]);

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
	{ keys: ['user:read', 'profile:read'], route: '/(admin)/usuarios' },
	{ keys: PORTAL_ACCESS_KEYS, route: '/(admin)/configuracoes' },
	{ keys: ['request:track'], route: '/(public)/acompanhar' }
];

export const ADMIN_AREA_KEYS: readonly PermissionKey[] = [
	...OPERATIONAL_AREA_KEYS,
	...PORTAL_ACCESS_KEYS
];

export function isAllowedReturnTo(value: string): boolean {
	if (!value.startsWith('/')) return false;
	if (value.startsWith('//')) return false;
	if (value.includes('://') || value.includes('\\')) return false;
	if ([...value].some((char) => char.charCodeAt(0) <= 0x1f || char.charCodeAt(0) === 0x7f)) {
		return false;
	}
	try {
		const url = new URL(value, 'http://internal');
		const isSameOrigin = url.origin === 'http://internal';
		const isInsideApp = !base || url.pathname === base || url.pathname.startsWith(`${base}/`);

		return isSameOrigin && isInsideApp;
	} catch {
		return false;
	}
}

function appendReturnTo(destination: string, returnTo?: string | null): string {
	if (!returnTo || !isAllowedReturnTo(returnTo)) return destination;

	const searchParams = new URLSearchParams({ returnTo });
	return `${destination}?${searchParams.toString()}`;
}

function loginRedirectPath(pathname?: string): string {
	return appendReturnTo(resolve(LOGIN_ROUTE), pathname);
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

export function redirectToLogin(url: URL): never {
	const returnTo = url.pathname + url.search;
	redirect(303, appendReturnTo(resolve(LOGIN_ROUTE), returnTo));
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
	const changePasswordPath = `${base}${CHANGE_PASSWORD_PATH}`;

	return pathname === changePasswordPath || pathname.startsWith(`${changePasswordPath}/`);
}

export function guardPasswordChange(user: SessionUser | null, url: URL): void {
	if (!user || !isPasswordChangeRequired(user) || isPasswordChangeRoute(url.pathname)) return;

	// Um returnTo para login/sem-autorizacao devolveria o usuário à tela de
	// entrada depois da troca obrigatória de senha, em vez da rota inicial.
	const returnTo = RETURN_TO_IGNORED_ROUTES.has(url.pathname) ? null : url.pathname + url.search;

	redirect(303, appendReturnTo(resolve(CHANGE_PASSWORD_ROUTE), returnTo));
}

export function getPostLoginRedirect(user: SessionUser, returnTo?: string | null): string {
	if (isPasswordChangeRequired(user)) {
		return appendReturnTo(resolve(CHANGE_PASSWORD_ROUTE), returnTo);
	}

	if (returnTo && isAllowedReturnTo(returnTo)) {
		return returnTo;
	}

	return getHomePath(user) ?? UNAUTHORIZED_PATH;
}

// Destino do clique num card de notificação: detalhe interno para quem tem
// acesso de leitura à solicitação; acompanhamento público para quem só
// acompanha o próprio protocolo.
export function resolveNotificationTarget(user: SessionUser, protocol: string): string {
	if (has('request:read', user)) {
		return resolve('/(admin)/fila/[protocolo]', { protocolo: protocol });
	}

	return resolve('/(public)/acompanhar/[protocolo]', { protocolo: protocol });
}
