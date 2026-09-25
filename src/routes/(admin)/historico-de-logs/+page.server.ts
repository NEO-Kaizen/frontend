import { isAuditEntityType } from '$lib/audit/audit-labels';
import { guard } from '$lib/services/access.service';
import { listAuditHistory } from '$lib/services/audit-history.service';
import { parsePageParam } from '$lib/utils/pagination';

import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	guard('managementOnly', locals.user, url.pathname);

	const requestedPage = parsePageParam(url.searchParams.get('page'));
	const rawEntityType = url.searchParams.get('entityType');
	const entityType = rawEntityType && isAuditEntityType(rawEntityType) ? rawEntityType : undefined;

	const result = await listAuditHistory(
		{ page: requestedPage, limit: PAGE_SIZE, entityType },
		fetch
	);

	const page = result.ok ? result.data.page : requestedPage;

	return { result, entityType: entityType ?? 'all', page, pageSize: PAGE_SIZE };
};
