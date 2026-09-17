import type { Handle, HandleFetch, RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { getMe } from '$lib/services/auth.service';
import { loadPortalConfig } from '$lib/config/portal-config.service';

const SESSION_COOKIE_NAME = 'session_id';

// Base da API mock servida pelo middleware do Vite em desenvolvimento.
const MOCK_API_PREFIX = '/__mock';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

	if (sessionId) {
		const result = await getMe(event.fetch);
		event.locals.user = result.ok ? result.data : null;
	} else {
		event.locals.user = null;
	}

	event.locals.portalConfig = await loadPortalConfig(event.fetch);
	return resolve(event);
};

// O fetch do load encaminha cookie apenas para o mesmo host ou subdomínio do app.
// Em topologias de domínios irmãos (app.x.com → api.x.com), completamos a lacuna.
export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
	const target = new URL(request.url);

	// Em dev a API mock é servida na mesma origem pelo middleware do Vite. O
	// fetch do load resolveria a URL internamente (sem passar pelo middleware),
	// então forçamos uma requisição HTTP real e reenviamos o cookie da sessão.
	// A checagem de origem evita encaminhar o cookie para outro host.
	if (dev && target.origin === event.url.origin && isMockPath(target.pathname)) {
		forwardCookie(event, request);
		return globalThis.fetch(request);
	}

	const apiUrl = resolveApiOrigin(env.PUBLIC_API_URL, event.url.origin);

	if (apiUrl && target.origin === apiUrl.origin) {
		const appHost = event.url.hostname;
		const apiHost = target.hostname;
		const kitForwards = apiHost === appHost || apiHost.endsWith(`.${appHost}`);

		if (!kitForwards) {
			forwardCookie(event, request);
		}
	}

	return fetch(request);
};

function isMockPath(pathname: string): boolean {
	return pathname === MOCK_API_PREFIX || pathname.startsWith(`${MOCK_API_PREFIX}/`);
}

function forwardCookie(event: RequestEvent, request: Request): void {
	const cookie = event.request.headers.get('cookie');
	if (cookie) request.headers.set('cookie', cookie);
}

// `PUBLIC_API_URL` pode ser absoluta (backend real) ou relativa (`/__mock`).
function resolveApiOrigin(value: string | undefined, appOrigin: string): URL | null {
	if (!value) return null;

	try {
		return new URL(value, appOrigin);
	} catch {
		return null;
	}
}
