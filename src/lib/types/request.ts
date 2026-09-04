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

export type TriageResult =
	| 'Elegível para avaliação'
	| 'Pendente de informações'
	| 'Fora do escopo'
	| 'Direcionada para outra área'
	| 'Duplicada'
	| 'Cancelada'
	| 'Backlog';

export type OperationalImpact = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

export type RequestCategory =
	| 'Automação'
	| 'Melhoria de processo'
	| 'Indicador'
	| 'Dashboard ou relatório'
	| 'Análise de dados'
	| 'Padronização'
	| 'Revisão de processo'
	| 'Apoio técnico'
	| 'Estudo de viabilidade'
	| 'Outros';

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

// Bloco 1 — dados do solicitante.
export interface RequesterBlock {
	fullName: string;
	corporateEmail: string;
	area: string;
	department?: string;
	manager: string;
	additionalContact?: string;
}

// Bloco 2 — dados da demanda.
export interface DemandBlock {
	title: string;
	requestType: string;
	category: RequestCategory;
	processName: string;
	description: string;
	problem: string;
	expectedResult: string;
	justification: string;
}

// Resposta "Sim/Não (+ detalhamento)": o detalhamento é a própria resposta
// positiva. `false` → "Não"; `string` → "Sim" + detalhamento obrigatório.
export type YesNoDetail = false | string;

// Bloco 3 — dados operacionais.
export interface OperationalBlock {
	processDescription: string;
	processSteps: string;
	systemsUsed: string;
	executionFrequency: string;
	volumetry: string;
	peopleInvolved: number;
	averageExecutionTime: string;
	monthlyEffortHours: number;
	hasManualControls: YesNoDetail;
	mainRisks: string;
	clientImpact: string;
	operationalImpact: OperationalImpact;
	desiredDeadline: string;
	perceivedCriticality: RequestPriority;
}

// Bloco 4 — integralmente opcional. Anexos NÃO estão aqui: são partes
// binárias do multipart do POST /requests (derivados no servidor).
export interface ComplementaryBlock {
	hasProcessDocumentation?: YesNoDetail;
	hasSimilarSolution?: YesNoDetail;
	dependsOnOtherAreas?: YesNoDetail;
	handlesRestrictedInfo?: YesNoDetail;
	additionalNotes?: string;
}

// Até 3 opções de data/hora para mapeamento — ISO "yyyy-mm-ddThh:mm".
export type SchedulePreferences = string[];

// Objeto serializado na parte textual "payload" do multipart do POST /requests.
export interface CreateRequestPayload {
	requester: RequesterBlock;
	demand: DemandBlock;
	operational: OperationalBlock;
	complementary?: ComplementaryBlock;
	schedulePreferences?: SchedulePreferences;
}

// Resposta do POST /requests (201 Created).
export interface CreateRequestResponse {
	protocol: string;
	status: RequestStatus;
	createdAt: string;
}

// Anexo a ser enviado como parte binária "attachments" — abstração da UI.
// Os metadados são derivados no servidor (não vão no payload).
export interface AttachmentFile {
	file: File;
	sizeBytes: number;
	mimeType: string;
}

// Metadados de anexo — derivados no servidor; apenas leitura futura.
export interface AttachmentMetadata {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
}

// Envelope de erro padronizado da API.
export interface ApiErrorResponse {
	status: 'error';
	statusCode: number;
	message: string;
}

// ---- Endpoints GET (contrato firmado; páginas futuras) ----

export interface ListRequestsQuery {
	email: string;
	search?: string;
	status?: RequestStatus;
	page?: number;
	pageSize?: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export interface RequestSummary {
	protocol: string;
	createdAt: string;
	processName: string;
	priority: RequestPriority | null;
	status: RequestStatus;
	assignee: string | null;
	requesterName: string;
}
export interface RequestsTableSummery extends RequestSummary {
  corporateEmail: string;
}

export interface RequestDetail {
	protocol: string;
	demandTitle: string;
	processName: string;
	status: RequestStatus;
	assigneeName: string | null;
	openedAt: string;
	estimatedCompletion: string | null;
	mappingDate: string | null;
	meeting: { scheduledFor: string; link: string | null } | null;
	pendingIssues: string[];
	nextStep: string;
	lastTechnicalMessage: string | null;
	lastUpdate: string;
	conclusion: {
		result: TriageResult;
		justification: string;
	} | null;
}
