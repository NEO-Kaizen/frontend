import { guardSession } from '$lib/services/access.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	guardSession(locals.user, url.pathname);
};
