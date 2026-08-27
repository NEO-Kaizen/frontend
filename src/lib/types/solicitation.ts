export type IdentificationData = {
	fullName: string;
	corporateEmail: string;
	area: string;
	department: string;
	manager: string;
	additionalContact: string;
};

export type DemandData = {
	title: string;
	category: RequestCategory | '';
	processName: string;
	description: string;
	justificationAndExpectedResult: string;
};

export type OperationalData = {
	volumetry: string;
	averageExecutionTime: string;
	desiredDeadline: string;
	operationalImpact: OperationalImpact | '';
	preferredSchedule: string[];
	files: DemandFile[];
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
	description: string;
	justificationAndExpectedResult: string;
};

export type OperationalBlock = {
	volumetry: string;
	averageExecutionTime: string;
	desiredDeadline: string;
	operationalImpact: OperationalImpact;
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
	2: ['title', 'category', 'processName', 'description', 'justificationAndExpectedResult'] as const,
	3: ['volumetry', 'averageExecutionTime', 'desiredDeadline', 'operationalImpact'] as const
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
	{ value: 'Crítico', label: 'Crítico'}
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

export type StepFieldErrors = Partial<Record<string, string>>;
