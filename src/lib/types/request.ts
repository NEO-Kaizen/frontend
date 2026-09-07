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

export type RequestType = 'Automação' | 'Melhoria' | 'Manutenção';

export type Frequency = 'Diária' | 'Semanal' | 'Mensal' | 'Por Demanda';

export type YesNo = 'Sim' | 'Não';

export type Criticality = RequestPriority;

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

// ---- Formulário de solicitação (estado das etapas da UI) ----

// Etapa 1 — identificação do solicitante.
export type IdentificationData = {
	fullName: string;
	corporateEmail: string;
	area: string;
	department: string;
	manager: string;
	additionalContact: string;
};

// Etapa 2 — dados da demanda.
export type DemandData = {
	title: string;
	category: RequestCategory | '';
	processName: string;
	requestType: RequestType | '';
	description: string;
	problem: string;
	justification: string;
	expectedResult: string;
};

// Etapa 3 — dados operacionais.
export type OperationalData = {
	processDescription: string;
	processSteps: string;
	systemsUsed: string;
	executionFrequency: Frequency | '';
	volumetry: string;
	peopleInvolved: string;
	averageExecutionTime: string;
	monthlyEffortHours: string;
	hasManualControls: YesNo | '';
	hasManualControlsDetail: string;
	mainRisks: string;
	clientImpact: string;
	operationalImpact: OperationalImpact | '';
	desiredDeadline: string;
	perceivedCriticality: Criticality | '';
};

// Arquivo em anexo — dados de UI para o estado do formulário (o upload binário
// real é enviado separadamente na parte "attachments" do multipart).
export type DemandFile = {
	id: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
};

// Etapa 4 — dados complementares (opcional).
export type ComplementaryData = {
	hasProcessDocumentation: YesNo | '';
	hasProcessDocumentationDetail: string;
	hasSimilarSolution: YesNo | '';
	hasSimilarSolutionDetail: string;
	dependsOnOtherAreas: YesNo | '';
	dependsOnOtherAreasDetail: string;
	handlesRestrictedInfo: YesNo | '';
	handlesRestrictedInfoDetail: string;
	additionalNotes: string;
	files: DemandFile[];
	preferredSchedule: string[];
};

export type DemandFormData = {
	requester: IdentificationData;
	demand: DemandData;
	operational: OperationalData;
	complementary: ComplementaryData;
};

// Erros de validação por campo de etapa.
export type StepFieldErrors = Partial<Record<string, string>>;

// Campos por etapa (para validação/gatilhos).
export const STEP_FIELDS = {
	1: ['fullName', 'corporateEmail', 'area', 'manager'] as const,
	2: [
		'title',
		'processName',
		'requestType',
		'category',
		'description',
		'problem',
		'justification',
		'expectedResult'
	] as const,
	3: [
		'processDescription',
		'processSteps',
		'systemsUsed',
		'executionFrequency',
		'volumetry',
		'peopleInvolved',
		'averageExecutionTime',
		'monthlyEffortHours',
		'hasManualControls',
		'mainRisks',
		'clientImpact',
		'operationalImpact',
		'desiredDeadline',
		'perceivedCriticality'
	] as const,
	4: [] as const
} as const;

// ---- Opções de formulário (valores e rótulos para selects) ----

export const CATEGORY_OPTIONS: { value: RequestCategory; label: string }[] = [
	{ value: 'Automação', label: 'Automação' },
	{ value: 'Melhoria de processo', label: 'Melhoria de processo' },
	{ value: 'Indicador', label: 'Indicador' },
	{ value: 'Dashboard ou relatório', label: 'Dashboard ou relatório' },
	{ value: 'Análise de dados', label: 'Análise de dados' },
	{ value: 'Padronização', label: 'Padronização' },
	{ value: 'Revisão de processo', label: 'Revisão de processo' },
	{ value: 'Apoio técnico', label: 'Apoio técnico' },
	{ value: 'Estudo de viabilidade', label: 'Estudo de viabilidade' },
	{ value: 'Outros', label: 'Outros' }
];

export const IMPACT_OPTIONS: { value: OperationalImpact; label: string }[] = [
	{ value: 'Baixo', label: 'Baixo' },
	{ value: 'Médio', label: 'Médio' },
	{ value: 'Alto', label: 'Alto' },
	{ value: 'Crítico', label: 'Crítico' }
];

export const AREA_OPTIONS = [
	{ value: 'Tecnologia da Informação', label: 'Tecnologia da Informação' },
	{ value: 'Recursos Humanos', label: 'Recursos Humanos' },
	{ value: 'Financeiro', label: 'Financeiro' },
	{ value: 'Operações', label: 'Operações' },
	{ value: 'Comercial', label: 'Comercial' },
	{ value: 'Marketing', label: 'Marketing' },
	{ value: 'Jurídico', label: 'Jurídico' },
	{ value: 'Administrativo', label: 'Administrativo' }
];

export const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string }[] = [
	{ value: 'Automação', label: 'Automação' },
	{ value: 'Melhoria', label: 'Melhoria' },
	{ value: 'Manutenção', label: 'Manutenção' }
];

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
	{ value: 'Diária', label: 'Diária' },
	{ value: 'Semanal', label: 'Semanal' },
	{ value: 'Mensal', label: 'Mensal' },
	{ value: 'Por Demanda', label: 'Por Demanda' }
];

export const CRITICALITY_OPTIONS: { value: Criticality; label: string }[] = [
	{ value: 'Baixa', label: 'Baixa' },
	{ value: 'Média', label: 'Média' },
	{ value: 'Alta', label: 'Alta' },
	{ value: 'Crítica', label: 'Crítica' }
];

export const YES_NO_OPTIONS: { value: YesNo; label: string }[] = [
	{ value: 'Sim', label: 'Sim' },
	{ value: 'Não', label: 'Não' }
];

// ---- Configuração de anexos ----

export const ALLOWED_FILE_TYPES = [
	'application/pdf',
	'image/png',
	'image/jpeg',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg'] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
