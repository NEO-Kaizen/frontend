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

export interface QueueFilterQuery {
	search?: string;
	status?: RequestStatus;
	priority?: RequestPriority;
	assigneeId?: number | 'unassigned';
}

export type QueueQuery = PaginationQuery & QueueFilterQuery;

export interface QueueItem extends RequestSummary {
	requesterEmail: string;
	assigneeId: number | null;
}

export interface QueueAssignee {
	id: number;
	name: string;
}

export interface QueueResponse extends PaginatedResponse<QueueItem> {
	assignees: QueueAssignee[];
}
