export type IdentificationData = {
	fullName: string;
	corporateEmail: string;
	area: string;
	department: string;
	manager: string;
	additionalContact: string;
};

export type RequestType = 'Automação' | 'Melhoria' | 'Manutenção';

export type Frequency = 'Diária' | 'Semanal' | 'Mensal' | 'Por Demanda';

export type RequestPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type Criticality = RequestPriority;

export type YesNo = 'Sim' | 'Não';

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

export type DemandFile = {
	id: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
};

export type DemandFormData = {
	requester: IdentificationData;
	demand: DemandData;
	operational: OperationalData;
	complementary: ComplementaryData;
};

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

/**
 * Resposta "Sim/Não (+ detalhamento)" — o detalhamento É a resposta positiva:
 * `false` = "Não"; `string` = "Sim" + detalhe (trim não-vazio).
 */
export type YesNoDetail = false | string;

export type AttachmentMetadata = {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
};

export type ComplementaryBlock = {
	hasProcessDocumentation?: YesNoDetail;
	hasSimilarSolution?: YesNoDetail;
	dependsOnOtherAreas?: YesNoDetail;
	handlesRestrictedInfo?: YesNoDetail;
	additionalNotes?: string;
	attachments?: AttachmentMetadata[];
};

export type RequesterBlock = {
	fullName: string;
	corporateEmail: string;
	area: string;
	department?: string;
	manager: string;
	additionalContact?: string;
};

export type DemandBlock = {
	title: string;
	category: RequestCategory;
	processName: string;
	requestType: RequestType;
	description: string;
	problem: string;
	justification: string;
	expectedResult: string;
};

export type OperationalBlock = {
	processDescription: string;
	processSteps: string;
	systemsUsed: string;
	executionFrequency: Frequency;
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
};

export type SchedulePreferences = string[];

export type CreateRequestPayload = {
	requester: RequesterBlock;
	demand: DemandBlock;
	operational: OperationalBlock;
	complementary?: ComplementaryBlock;
	schedulePreferences?: SchedulePreferences;
};

export type CreateRequestResponse = {
	protocol: string;
	status: RequestStatus;
	createdAt: string;
};

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

export const ALLOWED_FILE_TYPES = [
	'application/pdf',
	'image/png',
	'image/jpeg',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg'] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

export type StepFieldErrors = Partial<Record<string, string>>;
