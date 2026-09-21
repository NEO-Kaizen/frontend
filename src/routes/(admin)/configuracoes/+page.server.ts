import { loadPortalConfigStrict } from '$lib/config/portal-config.service';
import { guard } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

// Leitura autoritativa da configuração para a tela de admin: o `hooks.server`
// alimenta o layout com fallback para defaults (a app pública precisa continuar
// utilizável), mas aqui a falha do GET precisa ser visível. Em sucesso, o
// `portalConfig` retornado sombreia o do layout com o dado real; em falha,
// nenhum `portalConfig` é retornado (vale o do layout) e a flag
// `portalConfigLoadError` bloqueia edição/salvamento nos cards.
export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	guard('adminOnly', locals.user, url);

	const result = await loadPortalConfigStrict(fetch);
	if (result.ok) {
		return { portalConfig: result.data, portalConfigLoadError: null };
	}
	return { portalConfigLoadError: result.error };
};
