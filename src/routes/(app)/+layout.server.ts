import { guard } from '$lib/services/access.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	guard('anySession', locals.user);
};
