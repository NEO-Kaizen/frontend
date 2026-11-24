import { getUserStats, listUsers } from '$lib/services/user.service';
import { getProfileKeyCatalog, listProfiles } from '$lib/services/profile.service';
import { guardAny, has } from '$lib/services/access.service';
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
	const emptyUsers: Result<PaginatedResponse<AdminUser>> = {
		ok: true,
		data: { data: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 }
	};
	const emptyStats: UserStats = { total: 0, active: 0, pending: 0, admins: 0 };
	const userDataPromise = canReadUsers
		? Promise.all([
				listUsers({ page: 1, pageSize: PAGE_SIZE }, fetch),
				getUserStats(fetch)
			] as const)
		: Promise.resolve([emptyUsers, emptyStats] as const);
	const profileDataPromise = canReadProfiles
		? Promise.all([listProfiles(fetch), getProfileKeyCatalog(fetch)] as const)
		: Promise.resolve([null, null] as const);

	const [[result, stats], [profilesResult, profileKeyCatalogResult]] = await Promise.all([
		userDataPromise,
		profileDataPromise
	]);

	return {
		result,
		stats,
		pageSize: PAGE_SIZE,
		user: locals.user,
		profilesResult: profilesResult as Result<Profile[]> | null,
		profileKeyCatalogResult: profileKeyCatalogResult as Result<ProfileKeyCatalog> | null
	};
};
