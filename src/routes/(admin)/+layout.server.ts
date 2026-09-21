import { guard } from '$lib/services/access.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	guard('internalArea', locals.user, url);
};
