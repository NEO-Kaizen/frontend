import { resolve } from '$app/paths';
import { redirectToLogin } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.portalConfig.solicitationMode === 'AUTHENTICATED' && !locals.user) {
		redirectToLogin(url, resolve('/(public)/login'));
	}
};
