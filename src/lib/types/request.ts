export type RequestStatus =
	| 'Solicitação enviada'
	| 'Aguardando triagem'
	| 'Em triagem'
	| 'Pendente de informações'
	| 'Aguardando mapeamento'
	| 'Mapeamento agendado'
	| 'Em mapeamento'
	| 'Em análise de viabilidade'
	| 'Elegível'
	| 'Não elegível'
	| 'Priorizado'
	| 'Backlog'
	| 'Direcionado para outra área'
	| 'Em desenvolvimento'
	| 'Em homologação'
	| 'Concluído'
	| 'Cancelado';

export type RequestPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface RequestSummary {
	protocol: string;
	createdAt: string;
	processName: string;
	priority: RequestPriority | null;
	status: RequestStatus;
	assignee: string | null;
	requesterName: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export interface ListRequestsQuery {
	email: string;
	search?: string;
	status?: RequestStatus;
	page?: number;
	pageSize?: number;
}

export const REQUEST_STATUS_OPTIONS: RequestStatus[] = [
	'Solicitação enviada',
	'Aguardando triagem',
	'Em triagem',
	'Pendente de informações',
	'Aguardando mapeamento',
	'Mapeamento agendado',
	'Em mapeamento',
	'Em análise de viabilidade',
	'Elegível',
	'Não elegível',
	'Priorizado',
	'Backlog',
	'Direcionado para outra área',
	'Em desenvolvimento',
	'Em homologação',
	'Concluído',
	'Cancelado'
];

export type RequestCategory =
	| 'Automação de processos'
	| 'Integração de sistemas'
	| 'Relatórios e indicadores'
	| 'Gestão de pessoas'
	| 'Financeiro'
	| 'Jurídico'
	| 'TI e infraestrutura'
	| 'Atendimento ao cliente'
	| 'Compliance'
	| 'Outros';

export type OperationalImpact = 'Alto' | 'Médio' | 'Baixo';

export type TriageResult =
	| 'Elegível para avaliação'
	| 'Pendente de informações'
	| 'Fora do escopo'
	| 'Direcionada para outra área'
	| 'Duplicada'
	| 'Cancelada'
	| 'Backlog';

export interface RequestDetail {
	protocol: string;
	demandTitle: string;
	processName: string;
	status: RequestStatus;
	assigneeName: string | null;
	openedAt: string;
	estimatedCompletion: string | null;
	mappingDate: string | null;

	meeting: {
		scheduledFor: string;
		link: string | null;
	} | null;

	pendingIssues: string[];
	nextStep: string;
	lastTechnicalMessage: string | null;
	lastUpdate: string;

	conclusion: {
		result: TriageResult;
		justification: string;
	} | null;
}
