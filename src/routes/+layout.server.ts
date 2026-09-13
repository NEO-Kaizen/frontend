import { guardPasswordChange } from '$lib/services/access.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	guardPasswordChange(locals.user, url.pathname);

	return {
		user: locals.user,
		portalConfig: locals.portalConfig
	};
};
