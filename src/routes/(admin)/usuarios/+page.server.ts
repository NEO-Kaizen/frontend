import { redirect } from '@sveltejs/kit';

import { guardAny, has } from '$lib/services/access.service';
import {
	listAdministrableProfiles,
	listAssignableProfiles
} from '$lib/services/account-authority.service';
import {
	filterActiveProfiles,
	getProfileKeyCatalog,
	listProfiles
} from '$lib/services/profile.service';
import { getUserStats, listUsers } from '$lib/services/user.service';
import type { AdminUser, UserStats } from '$lib/types/user';
import type { Profile, ProfileKeyCatalog } from '$lib/types/profile';
import type { PaginatedResponse } from '$lib/types/request';
import type { Result } from '$lib/types/result';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	guardAny(['user:read', 'profile:read'], locals.user, url.pathname);

	const canReadUsers = has('user:read', locals.user);
	const canReadProfiles = has('profile:read', locals.user);

	const profileIdParam = url.searchParams.get('profileId');
	const requestedProfileId =
		profileIdParam && /^[1-9]\d*$/.test(profileIdParam) ? profileIdParam : undefined;

	const emptyUsers: Result<PaginatedResponse<AdminUser>> = {
		ok: true,
		data: { data: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 }
	};
	const emptyStats: UserStats = { total: 0, active: 0, pending: 0, admins: 0 };

	let profilesResult: Result<Profile[]> | null = null;
	let profileKeyCatalogResult: Result<ProfileKeyCatalog> | null = null;
	let allProfiles: Profile[] = [];
	let activeProfiles: Profile[] = [];
	let assignableProfiles: Profile[] = [];
	let administrableProfileIds: string[] = [];
	const profileId = requestedProfileId;

	if (canReadProfiles) {
		[profilesResult, profileKeyCatalogResult] = await Promise.all([
			listProfiles(fetch),
			getProfileKeyCatalog(fetch)
		]);

		if (profilesResult.ok) {
			allProfiles = profilesResult.data;
			activeProfiles = filterActiveProfiles(allProfiles);
			assignableProfiles = listAssignableProfiles(locals.user, activeProfiles);
			administrableProfileIds = listAdministrableProfiles(locals.user, allProfiles).map(
				(profile) => profile.id
			);

			// Formato é defesa local; existência fica com o backend. Com o catálogo
			// carregado, um id inexistente é canonicalizado para a URL e a UI.
			if (profileId && !allProfiles.some((profile) => profile.id === profileId)) {
				redirect(303, url.pathname);
			}
		}
	}

	const [result, stats]: [Result<PaginatedResponse<AdminUser>>, UserStats] = canReadUsers
		? await Promise.all([
				listUsers({ page: 1, pageSize: PAGE_SIZE, profileId }, fetch),
				getUserStats(fetch)
			])
		: [emptyUsers, emptyStats];

	return {
		result,
		stats,
		pageSize: PAGE_SIZE,
		user: locals.user,
		profileId: profileId ?? '',
		activeProfiles,
		assignableProfiles,
		administrableProfileIds,
		profiles: allProfiles,
		profilesResult,
		profileKeyCatalogResult,
		profilesError: profilesResult && !profilesResult.ok ? profilesResult.error : null
	};
};
