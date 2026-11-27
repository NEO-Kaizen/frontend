import { redirect } from '@sveltejs/kit';
import { getHomePath } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const homePath = getHomePath(locals.user);

	if (homePath) {
		redirect(303, homePath);
	}
};
