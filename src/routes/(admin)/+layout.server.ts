import { ADMIN_AREA_KEYS, guardAny } from '$lib/services/access.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	guardAny(ADMIN_AREA_KEYS, locals.user, url.pathname);
};
