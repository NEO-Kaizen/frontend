export type DashboardStatusTone = 'error' | 'success' | 'info' | 'warning' | 'neutral';
export type DashboardSituation = 'open' | 'closed' | 'overdue' | 'unassigned';

export interface DashboardQuery {
	from?: string;
	to?: string;
	situation?: DashboardSituation;
	statusId?: string;
	categoryId?: string;
	priorityId?: string;
}

export interface DashboardSummary {
	total: number;
	open: number;
	closed: number;
	overdue: number;
	unassigned: number;
}

export interface DashboardStatusMetric {
	id: number;
	name: string;
	count: number;
	tone: DashboardStatusTone;
	closesRequest: boolean;
}

export interface DashboardPriorityMetric {
	id: number | null;
	label: 'Baixa' | 'Média' | 'Alta' | 'Crítica' | 'Não priorizada';
	count: number;
}

export interface DashboardFilterOptions {
	statuses: Array<{ id: number; name: string }>;
	categories: Array<{ id: number; name: string }>;
	priorities: Array<{
		id: number;
		label: Exclude<DashboardPriorityMetric['label'], 'Não priorizada'>;
	}>;
}

export interface DashboardCategoryMetric {
	id: number;
	name: string;
	count: number;
}

export interface DashboardTrendPoint {
	period: string;
	count: number;
}

export interface DashboardResponse {
	filters: {
		from: string | null;
		to: string | null;
		situation: DashboardSituation | null;
		statusId: number | null;
		categoryId: number | null;
		priorityId: number | 'unassigned' | null;
	};
	filterOptions: DashboardFilterOptions;
	summary: DashboardSummary;
	byStatus: DashboardStatusMetric[];
	byPriority: DashboardPriorityMetric[];
	byCategory: DashboardCategoryMetric[];
	openedOverTime: DashboardTrendPoint[];
}
