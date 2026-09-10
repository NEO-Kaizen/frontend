import { guard, guardPasswordChange } from '$lib/services/access.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	guard('anySession', locals.user);
	guardPasswordChange(locals.user, url.pathname);
};
