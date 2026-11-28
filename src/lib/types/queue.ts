import type {
	PaginatedResponse,
	PaginationQuery,
	RequestPriority,
	RequestStatus,
	RequestSummary
} from './request';

export interface QueueMetricsResponse {
	totalRequests: number;
	unassignedRequests: number;
	inProgressRequests: number;
	overdueRequests: number;
}

// `'nenhum'` é o sentinela para solicitações ainda sem prioridade calculada
// (`priority === null`), espelhando `'unassigned'` em `assigneeId`.
export type PriorityFilter = RequestPriority | 'nenhum';

export type QueueSortField = 'createdAt' | 'priority' | 'status' | 'protocol';
export type QueueSortOrder = 'asc' | 'desc';

export interface QueueFilterQuery {
	search?: string;
	status?: RequestStatus;
	priority?: PriorityFilter;
	assigneeId?: string | 'unassigned';
	// Intervalo inclusivo em UTC (YYYY-MM-DD), comparado com `created_at`.
	createdFrom?: string;
	createdTo?: string;
	// Departamento do solicitante (texto livre, já com trim).
	department?: string;
	sortBy?: QueueSortField;
	sortOrder?: QueueSortOrder;
}

export type QueueQuery = PaginationQuery & QueueFilterQuery;

export type QueueFiltersState = {
	status: string;
	priority: string;
	assignee: string;
	department: string;
	dateFrom: string;
	dateTo: string;
	sortBy: QueueSortField;
	sortOrder: QueueSortOrder;
};

export interface QueueItem extends RequestSummary {
	requesterEmail: string;
	assigneeId: string | null;
	mappingAssigneeId?: string | null;
	mappingAssigneeName?: string | null;
}

export interface QueueAssignee {
	id: string;
	name: string;
}

export interface QueueResponse extends PaginatedResponse<QueueItem> {
	assignees: QueueAssignee[];
	// Departamentos distintos globais (não dependem de filtro/paginação), ordenados.
	// Opcional durante a transição, enquanto o backend não retorna o campo.
	departments?: string[];
}
