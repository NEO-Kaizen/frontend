import type { PaginatedResponse, RequestPriority, RequestStatus, RequestSummary } from './request';

export interface QueueMetricsResponse {
	totalRequests: number;
	unassignedRequests: number;
	inProgressRequests: number;
	overdueRequests: number;
}

export interface PaginationQuery {
	page: number;
	pageSize: number;
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
}

export type QueueResponse = PaginatedResponse<QueueItem>;
