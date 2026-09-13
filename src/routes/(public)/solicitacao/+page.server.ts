import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.portalConfig.solicitationMode !== 'AUTHENTICATED') {
		return;
	}

	if (!locals.user) {
		const returnTo = url.pathname + url.search;
		const searchParams = new URLSearchParams({ returnTo });
		redirect(303, `${resolve('/(public)/login')}?${searchParams.toString()}`);
	}
};
