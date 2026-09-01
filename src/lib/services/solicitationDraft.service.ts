import { browser } from '$app/environment';
import type {
	ComplementaryData,
	DemandData,
	IdentificationData,
	OperationalData
} from '$lib/types/solicitation';

const STORAGE_KEY = 'neo:solicitation-form:draft';
const STORAGE_VERSION = 1;

export interface SolicitationDraft {
	version: number;
	identification: IdentificationData;
	demand: DemandData;
	operational: OperationalData;
	complementary: ComplementaryData;
	currentStep: number;
	completedSteps: number[];
	visitedSteps: number[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
	if (!isRecord(value)) return false;
	return Object.values(value).every((v) => typeof v === 'string');
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isNumberArray(value: unknown): value is number[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'number');
}

function isIdentification(value: unknown): value is IdentificationData {
	return (
		isStringRecord(value) &&
		typeof value.fullName === 'string' &&
		typeof value.corporateEmail === 'string' &&
		typeof value.area === 'string' &&
		typeof value.department === 'string' &&
		typeof value.manager === 'string' &&
		typeof value.additionalContact === 'string'
	);
}

function isDemand(value: unknown): value is DemandData {
	return (
		isStringRecord(value) &&
		typeof value.title === 'string' &&
		typeof value.category === 'string' &&
		typeof value.processName === 'string' &&
		typeof value.requestType === 'string' &&
		typeof value.description === 'string' &&
		typeof value.problem === 'string' &&
		typeof value.justification === 'string' &&
		typeof value.expectedResult === 'string'
	);
}

function isOperational(value: unknown): value is OperationalData {
	return (
		isStringRecord(value) &&
		typeof value.processDescription === 'string' &&
		typeof value.processSteps === 'string' &&
		typeof value.systemsUsed === 'string' &&
		typeof value.executionFrequency === 'string' &&
		typeof value.volumetry === 'string' &&
		typeof value.peopleInvolved === 'string' &&
		typeof value.averageExecutionTime === 'string' &&
		typeof value.monthlyEffortHours === 'string' &&
		typeof value.hasManualControls === 'string' &&
		typeof value.hasManualControlsDetail === 'string' &&
		typeof value.mainRisks === 'string' &&
		typeof value.clientImpact === 'string' &&
		typeof value.operationalImpact === 'string' &&
		typeof value.desiredDeadline === 'string' &&
		typeof value.perceivedCriticality === 'string'
	);
}

function isComplementary(value: unknown): value is ComplementaryData {
	if (!isRecord(value)) return false;
	return (
		typeof value.hasProcessDocumentation === 'string' &&
		typeof value.hasProcessDocumentationDetail === 'string' &&
		typeof value.hasSimilarSolution === 'string' &&
		typeof value.hasSimilarSolutionDetail === 'string' &&
		typeof value.dependsOnOtherAreas === 'string' &&
		typeof value.dependsOnOtherAreasDetail === 'string' &&
		typeof value.handlesRestrictedInfo === 'string' &&
		typeof value.handlesRestrictedInfoDetail === 'string' &&
		typeof value.additionalNotes === 'string' &&
		Array.isArray(value.files) &&
		value.files.every(
			(f: unknown) =>
				isRecord(f) &&
				typeof f.id === 'string' &&
				typeof f.fileName === 'string' &&
				typeof f.mimeType === 'string' &&
				typeof f.sizeBytes === 'number'
		) &&
		isStringArray(value.preferredSchedule)
	);
}

function isValidDraft(value: unknown): value is SolicitationDraft {
	if (!isRecord(value)) return false;
	return (
		value.version === STORAGE_VERSION &&
		typeof value.currentStep === 'number' &&
		isNumberArray(value.completedSteps) &&
		isNumberArray(value.visitedSteps) &&
		isIdentification(value.identification) &&
		isDemand(value.demand) &&
		isOperational(value.operational) &&
		isComplementary(value.complementary)
	);
}

export function saveDraft(draft: SolicitationDraft): void {
	if (!browser) return;
	const payload = JSON.stringify({ ...draft, version: STORAGE_VERSION });
	localStorage.setItem(STORAGE_KEY, payload);
}

export function loadDraft(): SolicitationDraft | null {
	if (!browser) return null;

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed: unknown = JSON.parse(raw);
		return isValidDraft(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function clearDraft(): void {
	if (!browser) return;
	localStorage.removeItem(STORAGE_KEY);
}
