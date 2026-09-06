import { guard } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	guard('adminOnly', locals.user);
};
