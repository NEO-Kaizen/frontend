import type { LayoutServerLoad } from './$types';
import { loadPortalConfig } from '$lib/config/portal-config.service';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		portalConfig: await loadPortalConfig()
	};
};
