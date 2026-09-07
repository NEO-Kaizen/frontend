import type { Handle } from '@sveltejs/kit';
import { decodeJwt } from '$lib/utils/jwt';
import { loadPortalConfig } from '$lib/config/portal-config.service';

const SESSION_COOKIE_NAME = 'session_id';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = decodeJwt(event.cookies.get(SESSION_COOKIE_NAME) ?? '');
	event.locals.portalConfig = await loadPortalConfig();
	return resolve(event);
};
