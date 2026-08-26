export type IdentificationData = {
	fullName: string;
	email: string;
	area: string;
	department: string;
	managerName: string;
	additionalContact: string;
};

export type DemandData = {
	title: string;
	category: string;
	currentProcessName: string;
	description: string;
	justification: string;
};

export type OperationalData = {
	volume: string;
	executionTime: string;
	desiredDeadline: string;
	operationalImpact: 'Baixo' | 'Médio' | 'Alto' | '';
	preferredSchedule: string[];
	files: DemandFile[];
};

export type DemandFile = {
	id: string;
	name: string;
	size: number;
	type: string;
};

export type DemandFormData = {
	identification: IdentificationData;
	demand: DemandData;
	operational: OperationalData;
};

export const STEP_FIELDS = {
	1: ['fullName', 'email', 'area', 'department', 'managerName'] as const,
	2: ['title', 'category', 'currentProcessName', 'description', 'justification'] as const,
	3: ['volume', 'executionTime', 'desiredDeadline', 'operationalImpact'] as const
} as const;

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg'] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export type StepFieldErrors = Partial<Record<string, string>>;
