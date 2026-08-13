import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SESSION_COOKIE_NAME } from '$lib/server/session';

export const load: PageServerLoad = () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		// Sessão é um JWT sem estado no servidor: logout local é apagar o cookie.
		// Se o backend implementar invalidação de sessão, chamar o endpoint aqui (best-effort).
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(303, '/login');
	}
};
