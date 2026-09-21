import { guard } from '$lib/services/access.service';
import { getMyProfile } from '$lib/services/user.service';
import type { PageServerLoad } from './$types';

// "Meus dados" — self-service de qualquer perfil autenticado. O backend libera
// `/users/me` sem restrição de role; o guard do layout `(app)` é reforçado aqui
// para o caso de a rota ser acessada sem layout.
export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	guard('anySession', locals.user, url);

	const result = await getMyProfile(fetch);

	return { result };
};
