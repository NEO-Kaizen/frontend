import { guard } from '$lib/services/access.service';
import {
	listAdministrableProfiles,
	listAssignableProfiles
} from '$lib/services/account-authority.service';
import { filterActiveProfiles, listProfiles } from '$lib/services/profile.service';
import { getUserStats, listUsers } from '$lib/services/user.service';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	guard('user:read', locals.user, url.pathname);
	guard('profile:read', locals.user, url.pathname);

	const profileIdParam = url.searchParams.get('profileId');
	const profileId =
		profileIdParam && /^[1-9]\d*$/.test(profileIdParam) ? profileIdParam : undefined;

	const profilesResult = await listProfiles(fetch);
	const allProfiles = profilesResult.ok ? profilesResult.data : [];
	const activeProfiles = profilesResult.ok ? filterActiveProfiles(profilesResult.data) : [];
	const profilesError = profilesResult.ok ? null : profilesResult.error;

	const validProfileId =
		profileId && activeProfiles.some((profile) => profile.id === profileId) ? profileId : undefined;
	const assignableProfiles = listAssignableProfiles(locals.user, activeProfiles);
	const administrableProfileIds = listAdministrableProfiles(locals.user, allProfiles).map(
		(profile) => profile.id
	);

	const [result, stats] = await Promise.all([
		listUsers({ page: 1, pageSize: PAGE_SIZE, profileId: validProfileId }, fetch),
		getUserStats(fetch)
	]);

	return {
		result,
		stats,
		pageSize: PAGE_SIZE,
		user: locals.user,
		profileId: validProfileId ?? '',
		activeProfiles,
		assignableProfiles,
		administrableProfileIds,
		profilesError
	};
};
