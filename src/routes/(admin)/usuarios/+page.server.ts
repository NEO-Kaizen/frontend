import { getUserStats, listUsers } from '$lib/services/user.service';
import { getProfileKeyCatalog, listProfiles } from '$lib/services/profile.service';
import { guardAny, has } from '$lib/services/access.service';
import type { AdminUser, UserStats } from '$lib/types/user';
import type { PaginatedResponse } from '$lib/types/request';
import type { Profile, ProfileKeyCatalog } from '$lib/types/profile';
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
	type UserDataPromise = {
		result: Result<PaginatedResponse<AdminUser>>;
		stats: UserStats;
	};
	type ProfileDataPromise = {
		profilesResult: Result<Profile[]> | null;
		profileKeyCatalogResult: Result<ProfileKeyCatalog> | null;
	};

	const userDataPromise: UserDataPromise = canReadUsers
		? {
				result: await listUsers({ page: 1, pageSize: PAGE_SIZE }, fetch),
				stats: await getUserStats(fetch)
			}
		: { result: emptyUsers, stats: emptyStats };
	const profileDataPromise: ProfileDataPromise = canReadProfiles
		? {
				profilesResult: await listProfiles(locals.user, fetch),
				profileKeyCatalogResult: await getProfileKeyCatalog(locals.user, fetch)
			}
		: { profilesResult: null, profileKeyCatalogResult: null };

	return {
		result: userDataPromise.result,
		stats: userDataPromise.stats,
		pageSize: PAGE_SIZE,
		user: locals.user,
		profilesResult: profileDataPromise.profilesResult,
		profileKeyCatalogResult: profileDataPromise.profileKeyCatalogResult
	};
};
