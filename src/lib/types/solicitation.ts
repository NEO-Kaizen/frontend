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

export type Criticality = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type YesNo = 'Sim' | 'Não';

export type DemandData = {
	title: string;
	category: RequestCategory | '';
	processName: string;
	requestType: RequestType | '';
	description: string;
	problemOrOpportunity: string;
	justification: string;
	expectedResult: string;
	/** @deprecated manter compatibilidade por 1 release */
	justificationAndExpectedResult?: string;
};

export type OperationalData = {
	currentProcessDescription: string;
	mainProcessSteps: string;
	systemsUsed: string;
	executionFrequency: Frequency | '';
	volumetry: string;
	peopleInvolvedCount: string;
	averageExecutionTime: string;
	monthlyEffortHours: string;
	hasManualControls: string;
	mainRisks: string;
	customerImpact: string;
	operationalImpact: OperationalImpact | '';
	desiredDeadline: string;
	perceivedCriticality: Criticality | '';
};

export type ComplementaryData = {
	hasProcessDocumentation: YesNo | '';
	documentationDetails: string;
	hasSimilarSolution: YesNo | '';
	otherAreasDependency: string;
	restrictedInformation: string;
	additionalObservations: string;
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

// export type RequestPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

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

export type AttachmentMetadata = {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
};

export type ComplementaryBlock = {
	hasProcessDocumentation?: YesNo;
	documentationDetails?: string;
	hasSimilarSolution?: YesNo;
	otherAreasDependency?: string;
	restrictedInformation?: string;
	additionalObservations?: string;
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
	problemOrOpportunity: string;
	justification: string;
	expectedResult: string;
};

export type OperationalBlock = {
	currentProcessDescription: string;
	mainProcessSteps: string;
	systemsUsed: string;
	executionFrequency: Frequency;
	volumetry: string;
	peopleInvolvedCount: number;
	averageExecutionTime: string;
	monthlyEffortHours: number;
	hasManualControls: string;
	mainRisks: string;
	customerImpact: string;
	operationalImpact: OperationalImpact;
	desiredDeadline: string;
	perceivedCriticality: Criticality;
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
	status: string;
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
		'problemOrOpportunity',
		'justification',
		'expectedResult'
	] as const,
	3: [
		'currentProcessDescription',
		'mainProcessSteps',
		'systemsUsed',
		'executionFrequency',
		'volumetry',
		'peopleInvolvedCount',
		'averageExecutionTime',
		'monthlyEffortHours',
		'hasManualControls',
		'mainRisks',
		'customerImpact',
		'operationalImpact',
		'desiredDeadline',
		'perceivedCriticality'
	] as const,
	4: [] as const
} as const;

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;

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
