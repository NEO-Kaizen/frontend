import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { getHomeRedirect } from '$lib/services/access.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const homeRedirect = getHomeRedirect(locals.user);

	if (homeRedirect) {
		redirect(303, resolve(homeRedirect));
	}
};
