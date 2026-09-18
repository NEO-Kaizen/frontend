import type {
	DashboardCategoryMetric,
	DashboardPriorityMetric,
	DashboardQuery,
	DashboardResponse,
	DashboardSituation,
	DashboardStatusMetric
} from '$lib/types/dashboard';

interface MockDashboardRequest {
	openedAt: string;
	status: Omit<DashboardStatusMetric, 'count'>;
	priority: DashboardPriorityMetric['label'];
	category: Omit<DashboardCategoryMetric, 'count'>;
	isOverdue: boolean;
	isAssigned: boolean;
}

const statuses = {
	received: {
		id: 1,
		name: 'Solicitação enviada',
		tone: 'info',
		closesRequest: false
	},
	triage: { id: 3, name: 'Em triagem', tone: 'info', closesRequest: false },
	mapping: { id: 7, name: 'Em mapeamento', tone: 'info', closesRequest: false },
	development: { id: 14, name: 'Em desenvolvimento', tone: 'info', closesRequest: false },
	done: { id: 16, name: 'Concluído', tone: 'success', closesRequest: true },
	cancelled: { id: 17, name: 'Cancelado', tone: 'neutral', closesRequest: true }
} as const satisfies Record<string, Omit<DashboardStatusMetric, 'count'>>;

const categories = {
	automation: { id: 1, name: 'Automação' },
	improvement: { id: 2, name: 'Melhoria de processo' },
	dashboard: { id: 4, name: 'Dashboard ou relatório' },
	data: { id: 5, name: 'Análise de dados' }
} as const satisfies Record<string, Omit<DashboardCategoryMetric, 'count'>>;

const priorities = [
	{ id: 1, label: 'Baixa' },
	{ id: 2, label: 'Média' },
	{ id: 3, label: 'Alta' },
	{ id: 4, label: 'Crítica' }
] as const;

const priorityIdByLabel: Record<DashboardPriorityMetric['label'], number | null> = {
	Baixa: 1,
	Média: 2,
	Alta: 3,
	Crítica: 4,
	'Não priorizada': null
};

const requests: MockDashboardRequest[] = [
	{
		openedAt: '2026-07-03',
		status: statuses.done,
		priority: 'Alta',
		category: categories.automation,
		isOverdue: false,
		isAssigned: true
	},
	{
		openedAt: '2026-07-15',
		status: statuses.cancelled,
		priority: 'Baixa',
		category: categories.improvement,
		isOverdue: false,
		isAssigned: false
	},
	{
		openedAt: '2026-07-28',
		status: statuses.development,
		priority: 'Crítica',
		category: categories.data,
		isOverdue: true,
		isAssigned: true
	},
	{
		openedAt: '2026-08-02',
		status: statuses.mapping,
		priority: 'Média',
		category: categories.dashboard,
		isOverdue: false,
		isAssigned: true
	},
	{
		openedAt: '2026-08-08',
		status: statuses.triage,
		priority: 'Não priorizada',
		category: categories.automation,
		isOverdue: true,
		isAssigned: false
	},
	{
		openedAt: '2026-08-17',
		status: statuses.received,
		priority: 'Não priorizada',
		category: categories.improvement,
		isOverdue: false,
		isAssigned: false
	},
	{
		openedAt: '2026-08-24',
		status: statuses.development,
		priority: 'Alta',
		category: categories.automation,
		isOverdue: false,
		isAssigned: true
	},
	{
		openedAt: '2026-09-01',
		status: statuses.triage,
		priority: 'Não priorizada',
		category: categories.data,
		isOverdue: false,
		isAssigned: false
	},
	{
		openedAt: '2026-09-05',
		status: statuses.mapping,
		priority: 'Alta',
		category: categories.dashboard,
		isOverdue: false,
		isAssigned: true
	},
	{
		openedAt: '2026-09-10',
		status: statuses.received,
		priority: 'Não priorizada',
		category: categories.improvement,
		isOverdue: false,
		isAssigned: false
	}
];

function increment<TKey>(map: Map<TKey, number>, key: TKey): void {
	map.set(key, (map.get(key) ?? 0) + 1);
}

function matchesSituation(request: MockDashboardRequest, situation?: DashboardSituation): boolean {
	if (!situation) return true;
	if (situation === 'open') return !request.status.closesRequest;
	if (situation === 'closed') return request.status.closesRequest;
	if (situation === 'overdue') return !request.status.closesRequest && request.isOverdue;
	return !request.status.closesRequest && !request.isAssigned;
}

export async function getDashboardMock(query: DashboardQuery): Promise<DashboardResponse> {
	const filtered = requests.filter(
		(request) =>
			(!query.from || request.openedAt >= query.from) &&
			(!query.to || request.openedAt <= query.to) &&
			matchesSituation(request, query.situation) &&
			(!query.statusId || String(request.status.id) === query.statusId) &&
			(!query.categoryId || String(request.category.id) === query.categoryId) &&
			(!query.priorityId ||
				(query.priorityId === 'unassigned'
					? priorityIdByLabel[request.priority] === null
					: String(priorityIdByLabel[request.priority]) === query.priorityId))
	);

	const statusCounts = new Map<number, number>();
	const priorityCounts = new Map<DashboardPriorityMetric['label'], number>();
	const categoryCounts = new Map<number, number>();
	const periodCounts = new Map<string, number>();

	for (const request of filtered) {
		increment(statusCounts, request.status.id);
		increment(priorityCounts, request.priority);
		increment(categoryCounts, request.category.id);
		increment(periodCounts, request.openedAt.slice(0, 7));
	}

	const uniqueStatuses = new Map(requests.map((request) => [request.status.id, request.status]));
	const uniqueCategories = new Map(
		requests.map((request) => [request.category.id, request.category])
	);

	return {
		filters: {
			from: query.from ?? null,
			to: query.to ?? null,
			situation: query.situation ?? null,
			statusId: query.statusId ? Number(query.statusId) : null,
			categoryId: query.categoryId ? Number(query.categoryId) : null,
			priorityId:
				query.priorityId === 'unassigned'
					? 'unassigned'
					: query.priorityId
						? Number(query.priorityId)
						: null
		},
		filterOptions: {
			statuses: [...uniqueStatuses.values()].map(({ id, name }) => ({ id, name })),
			categories: [...uniqueCategories.values()].map(({ id, name }) => ({ id, name })),
			priorities: [...priorities]
		},
		summary: {
			total: filtered.length,
			open: filtered.filter((request) => !request.status.closesRequest).length,
			closed: filtered.filter((request) => request.status.closesRequest).length,
			overdue: filtered.filter((request) => !request.status.closesRequest && request.isOverdue)
				.length,
			unassigned: filtered.filter((request) => !request.status.closesRequest && !request.isAssigned)
				.length
		},
		byStatus: [...uniqueStatuses.values()]
			.filter((status) => statusCounts.has(status.id))
			.map((status) => ({ ...status, count: statusCounts.get(status.id) ?? 0 })),
		byPriority: [...priorityCounts.entries()].map(([label, count]) => ({
			id: priorityIdByLabel[label],
			label,
			count
		})),
		byCategory: [...uniqueCategories.values()]
			.filter((category) => categoryCounts.has(category.id))
			.map((category) => ({ ...category, count: categoryCounts.get(category.id) ?? 0 })),
		openedOverTime: [...periodCounts.entries()]
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([period, count]) => ({ period, count }))
	};
}
