import { redirectToLogin } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

// Server load (não universal): nunca busca os dados da solicitação aqui —
// eles trafegam após a validação pública (identidade em `sessionStorage` +
// header `X-Requester-Identity`, sem JWT/cookie) ou sessão, direto no cliente.
// O servidor expõe apenas protocolo, modo e usuário.
export const load: PageServerLoad = ({ locals, params, url }) => {
	if (locals.portalConfig.solicitationMode === 'AUTHENTICATED' && !locals.user) {
		redirectToLogin(url);
	}

	return {
		protocol: params.protocolo,
		solicitationMode: locals.portalConfig.solicitationMode,
		user: locals.user
	};
};
