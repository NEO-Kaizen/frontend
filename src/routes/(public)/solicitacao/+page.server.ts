import { resolve } from '$app/paths';
import { redirectToLogin } from '$lib/services/access.service';
import { getMyProfile } from '$lib/services/user.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	if (locals.portalConfig.solicitationMode === 'AUTHENTICATED' && !locals.user) {
		redirectToLogin(url, resolve('/(public)/login'));
	}

	// Prefill best-effort do bloco de solicitante do "Meus dados" (GET /users/me).
	// Sem sessão não há chamada extra; falha na leitura apenas deixa os campos vazios.
	const profile = locals.user ? await getMyProfile(fetch) : null;

	return {
		requesterProfile: profile?.ok ? profile.data.requester : null
	};
};
