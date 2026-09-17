import type { Handle, HandleFetch } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { getMe } from '$lib/services/auth.service';
import { loadPortalConfig } from '$lib/config/portal-config.service';

const SESSION_COOKIE_NAME = 'session_id';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

	if (sessionId) {
		const result = await getMe(event.fetch, sessionId);
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
	const publicApiUrl = publicEnv.PUBLIC_API_URL ? new URL(publicEnv.PUBLIC_API_URL) : null;

	const internalApiUrl = privateEnv.API_INTERNAL_URL
		? new URL(privateEnv.API_INTERNAL_URL)
		: null;

	const target = new URL(request.url);

	// -------------------mapping--------------------------
	// https://lab.alphaedtech.org.br/server03/api/auth/me
  //                          ↓
	// http://127.0.0.1:3000/auth/me
	if(publicApiUrl) {
		const publicApiPath = publicApiUrl.pathname.replace(/\/$/, '');

		const isPublicApiRequest =
			target.origin === publicApiUrl.origin &&
			(target.pathname === publicApiPath ||
				target.pathname.startsWith(`${publicApiPath}/`));
			
		if (isPublicApiRequest && internalApiUrl) {
			const suffix = target.pathname.slice(publicApiPath.length);
			const internalPath = internalApiUrl.pathname.replace(/\/$/, '');

			const internalTarget = new URL(internalApiUrl);
			internalTarget.pathname = `${internalPath}${suffix}`;
			internalTarget.search = target.search;

			request = new Request(internalTarget, request);

			const cookie = event.request.headers.get('cookie');

			if (cookie && !request.headers.has('cookie')) {
				request.headers.set('cookie', cookie);
			}

			return fetch(request);
		}

		// Evita uma recursão silenciosa quando a API pública usa a mesma
		// origem do frontend, mas a URL interna não foi configurada.
		if (isPublicApiRequest && target.origin === event.url.origin) {
			throw new Error(
				'API_INTERNAL_URL precisa estar definida quando a API pública usa a mesma origem do frontend.'
			);
		}

		// Em topologias de domínios irmãos, encaminha o cookie manualmente
		// quando o SvelteKit não faria isso automaticamente.
		if (target.origin === publicApiUrl.origin) {
			const appHost = event.url.hostname;
			const apiHost = target.hostname;
			const kitForwards = apiHost === appHost || apiHost.endsWith(`.${appHost}`);

			if (!kitForwards) {
				const cookie = event.request.headers.get('cookie');
				if (cookie) request.headers.set('cookie', cookie);
			}
		}

	}

	return fetch(request);
};
