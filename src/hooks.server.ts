import type { Handle, HandleFetch } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
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
	const apiUrl = env.PUBLIC_API_URL ? new URL(env.PUBLIC_API_URL) : null;
	const target = new URL(request.url);

	if (apiUrl && target.origin === apiUrl.origin) {
		const appHost = event.url.hostname;
		const apiHost = target.hostname;
		const kitForwards = apiHost === appHost || apiHost.endsWith(`.${appHost}`);

		if (!kitForwards) {
			const cookie = event.request.headers.get('cookie');
			if (cookie) request.headers.set('cookie', cookie);
		}
	}

	return fetch(request);
};
