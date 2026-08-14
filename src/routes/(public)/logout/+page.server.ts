import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { SESSION_COOKIE_NAME } from '$lib/server/session';

const LOGOUT_PATH = '/auth/logout';

export const load: PageServerLoad = () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
		if (sessionCookie && env.PUBLIC_API_URL) {
			try {
				await fetch(`${env.PUBLIC_API_URL}${LOGOUT_PATH}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionCookie)}`
					}
				});
			} catch {
				// Falha na invalidação remota não deve bloquear o logout local.
			}
		}

		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(303, '/login');
	}
};
