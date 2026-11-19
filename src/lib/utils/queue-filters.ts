import type { QueueFilterQuery, QueueSortField, QueueSortOrder } from '$lib/types/queue';
import type { RequestPriority, RequestStatus } from '$lib/types/request';

export const ALL_FILTER = 'all';
export const UNASSIGNED_FILTER = 'unassigned';
export const NO_PRIORITY_FILTER = 'nenhum';
export const DEFAULT_SORT_BY: QueueSortField = 'createdAt';
export const DEFAULT_SORT_ORDER: QueueSortOrder = 'desc';
export const MAX_DEPARTMENT_LENGTH = 200;
export const MAX_SEARCH_LENGTH = 254;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// A API aceita tanto `professional_id` (UUID) quanto `user_id` numérico.
const ASSIGNEE_ID_PATTERN =
	/^(?:\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const SORT_FIELDS: QueueSortField[] = ['createdAt', 'priority', 'status', 'protocol'];
const SORT_ORDERS: QueueSortOrder[] = ['asc', 'desc'];

function parseDateParam(raw: string | null): string | undefined {
	const value = raw?.trim();

	if (!value || !DATE_PATTERN.test(value)) {
		return undefined;
	}

	return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? undefined : value;
}

// Parser único dos filtros da fila: reutilizado pelo load e pela exportação CSV.
export function parseQueueFilterQuery(params: URLSearchParams): QueueFilterQuery {
	const query: QueueFilterQuery = {};

	const search = params.get('search')?.trim();

	if (search && search.length <= MAX_SEARCH_LENGTH) {
		query.search = search;
	}

	const status = params.get('status');

	if (status && status !== ALL_FILTER) {
		query.status = status as RequestStatus;
	}

	const priority = params.get('priority');

	if (priority === NO_PRIORITY_FILTER) {
		query.priority = NO_PRIORITY_FILTER;
	} else if (priority && priority !== ALL_FILTER) {
		query.priority = priority as RequestPriority;
	}

	const assigneeId = params.get('assigneeId')?.trim();

	if (assigneeId === UNASSIGNED_FILTER) {
		query.assigneeId = UNASSIGNED_FILTER;
	} else if (assigneeId && ASSIGNEE_ID_PATTERN.test(assigneeId)) {
		query.assigneeId = assigneeId;
	}

	let createdFrom = parseDateParam(params.get('createdFrom'));
	let createdTo = parseDateParam(params.get('createdTo'));

	if (createdFrom && createdTo && createdFrom > createdTo) {
		[createdFrom, createdTo] = [createdTo, createdFrom];
	}

	if (createdFrom) {
		query.createdFrom = createdFrom;
	}

	if (createdTo) {
		query.createdTo = createdTo;
	}

	const department = params.get('department')?.trim();

	if (department && department.length <= MAX_DEPARTMENT_LENGTH) {
		query.department = department;
	}

	const sortBy = params.get('sortBy');

	if (sortBy && SORT_FIELDS.includes(sortBy as QueueSortField)) {
		query.sortBy = sortBy as QueueSortField;
	}

	const sortOrder = params.get('sortOrder');

	if (sortOrder && SORT_ORDERS.includes(sortOrder as QueueSortOrder)) {
		query.sortOrder = sortOrder as QueueSortOrder;
	}

	return query;
}

// Centraliza os nomes dos parâmetros compartilhados por GET /queue e pela exportação.
export function appendQueueFilterParams(params: URLSearchParams, filters: QueueFilterQuery): void {
	if (filters.search) params.set('search', filters.search);
	if (filters.status) params.set('status', filters.status);
	if (filters.priority) params.set('priority', filters.priority);
	if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
	if (filters.createdFrom) params.set('createdFrom', filters.createdFrom);
	if (filters.createdTo) params.set('createdTo', filters.createdTo);
	if (filters.department) params.set('department', filters.department);
	if (filters.sortBy) params.set('sortBy', filters.sortBy);
	if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
}
