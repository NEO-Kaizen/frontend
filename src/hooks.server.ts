import type { Handle } from '@sveltejs/kit';
import { decodeJwt } from '$lib/utils/jwt';

const SESSION_COOKIE_NAME = 'session_id';

export const handle: Handle = ({ event, resolve }) => {
	event.locals.user = decodeJwt(event.cookies.get(SESSION_COOKIE_NAME) ?? '');
	return resolve(event);
};
