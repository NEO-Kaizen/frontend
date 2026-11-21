import type {
	InternalRequestDetail,
	UpdateInternalRequestPayload,
	YesNo,
	YesNoDetail
} from '$lib/types/request';
import { isFutureOrToday, isRequired, isValidText, parseNumber } from '$lib/utils/validations';

// Rascunho de edição: números como string para `Input type=number` aceitar
// campo vazio. A conversão acontece só no payload (espelha `buildPayload`).
export interface EditableDraft {
	requester: InternalRequestDetail['requester'];
	demand: InternalRequestDetail['demand'];
	operational: Omit<
		InternalRequestDetail['operational'],
		'peopleInvolved' | 'monthlyEffortHours'
	> & {
		peopleInvolved: string;
		monthlyEffortHours: string;
	};
	complementary?: InternalRequestDetail['complementary'];
}

export function toEditableDraft(source: InternalRequestDetail): EditableDraft {
	return {
		requester: { ...source.requester },
		demand: { ...source.demand },
		operational: {
			...source.operational,
			peopleInvolved: String(source.operational.peopleInvolved ?? ''),
			monthlyEffortHours: String(source.operational.monthlyEffortHours ?? '')
		},
		complementary: source.complementary ? { ...source.complementary } : undefined
	};
}

export function todayISO(): string {
	return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// `YesNoDetail` (false|string|undefined) <-> `Select` Sim/Não/vazio.
// `''` (string vazia) = "Sim" selecionado sem detalhe ainda.
export function toChoice(value: YesNoDetail | undefined | null): YesNo | '' {
	if (value === undefined || value === null) return '';
	if (value === false) return 'Não';
	return 'Sim';
}

function detailOf(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

// Caminhos que guardam `YesNoDetail` (escolha + detalhe no mesmo valor).
const YESNO_PATHS = new Set([
	'operational.hasManualControls',
	'complementary.hasProcessDocumentation',
	'complementary.hasSimilarSolution',
	'complementary.dependsOnOtherAreas',
	'complementary.handlesRestrictedInfo'
]);

const DETAIL_SUFFIX = 'Detail';

function getByPath(root: unknown, path: string): unknown {
	return path.split('.').reduce<unknown>((acc, key) => {
		if (typeof acc !== 'object' || acc === null) return undefined;
		return (acc as Record<string, unknown>)[key];
	}, root);
}

function setByPath(root: object, path: string, value: unknown): void {
	const keys = path.split('.');
	let node = root as Record<string, unknown>;
	for (let i = 0; i < keys.length - 1; i++) {
		const next = node[keys[i]];
		if (typeof next !== 'object' || next === null) {
			const created: Record<string, unknown> = {};
			node[keys[i]] = created;
			node = created;
		} else {
			node = next as Record<string, unknown>;
		}
	}
	node[keys[keys.length - 1]] = value;
}

// Aplica uma mudança do formulário no draft, centralizando as conversões
// `YesNoDetail` (escolha preserva detalhe; detalhe implica "Sim").
export function applyFieldChange(draft: EditableDraft, path: string, value: string): void {
	if (path.endsWith(DETAIL_SUFFIX)) {
		setByPath(draft, path.slice(0, -DETAIL_SUFFIX.length), value);
		return;
	}
	if (YESNO_PATHS.has(path)) {
		const currentDetail = detailOf(getByPath(draft, path));
		if (value === 'Não') setByPath(draft, path, false);
		else if (value === 'Sim') setByPath(draft, path, currentDetail);
		else setByPath(draft, path, undefined);
		return;
	}
	setByPath(draft, path, value);
}

// Validação espelhando 1:1 os `Step*.validate()` do formulário de solicitação.
// Chave = caminho do campo no draft (`demand.title`,
// `operational.hasManualControlsDetail` para o detalhe do par).
export function validateEditDraft(draft: EditableDraft): Record<string, string> {
	const errors: Record<string, string> = {};
	const requester = draft.requester;
	const demand = draft.demand;
	const operational = draft.operational;
	const complementary = draft.complementary;

	if (!isValidText(requester.area) || !isRequired(requester.area)) {
		errors['requester.area'] = 'Campo obrigatório, apenas texto.';
	}
	if ((requester.department ?? '').trim() && !isValidText(requester.department ?? '')) {
		errors['requester.department'] = 'Apenas texto.';
	}
	if (!isValidText(requester.manager) || !isRequired(requester.manager)) {
		errors['requester.manager'] = 'Campo obrigatório, apenas texto.';
	}
	if ((requester.additionalContact ?? '').trim().length > 0) {
		if ((requester.additionalContact ?? '').trim().length < 3) {
			errors['requester.additionalContact'] = 'Informe um contato válido.';
		}
	}

	if (!isRequired(demand.title)) errors['demand.title'] = 'Campo obrigatório.';
	if (!isRequired(demand.processName)) errors['demand.processName'] = 'Campo obrigatório.';
	if (!demand.requestType) errors['demand.requestType'] = 'Campo obrigatório.';
	if (!demand.category) errors['demand.category'] = 'Campo obrigatório.';
	if (!isRequired(demand.description)) errors['demand.description'] = 'Campo obrigatório.';
	if (!isRequired(demand.problem)) errors['demand.problem'] = 'Campo obrigatório.';
	if (!isRequired(demand.justification)) errors['demand.justification'] = 'Campo obrigatório.';
	if (!isRequired(demand.expectedResult)) errors['demand.expectedResult'] = 'Campo obrigatório.';

	if (!isRequired(operational.processDescription)) {
		errors['operational.processDescription'] = 'Campo obrigatório.';
	}
	if (!isRequired(operational.processSteps)) {
		errors['operational.processSteps'] = 'Campo obrigatório.';
	}
	if (!isRequired(operational.systemsUsed))
		errors['operational.systemsUsed'] = 'Campo obrigatório.';
	if (!operational.executionFrequency) {
		errors['operational.executionFrequency'] = 'Campo obrigatório.';
	}
	if (!isRequired(operational.volumetry)) errors['operational.volumetry'] = 'Campo obrigatório.';

	const peopleInvolved = parseNumber(operational.peopleInvolved);
	if (peopleInvolved === null) {
		errors['operational.peopleInvolved'] = 'Campo obrigatório.';
	} else if (!Number.isInteger(peopleInvolved) || peopleInvolved < 1) {
		errors['operational.peopleInvolved'] = 'Informe um número inteiro maior que 0.';
	}

	if (!isRequired(operational.averageExecutionTime)) {
		errors['operational.averageExecutionTime'] = 'Campo obrigatório.';
	}

	const monthlyEffortHours = parseNumber(operational.monthlyEffortHours);
	if (monthlyEffortHours === null) {
		errors['operational.monthlyEffortHours'] = 'Campo obrigatório.';
	} else if (monthlyEffortHours < 0) {
		errors['operational.monthlyEffortHours'] = 'Informe um número maior ou igual a 0.';
	}

	const manualChoice = toChoice(operational.hasManualControls);
	if (!manualChoice) {
		errors['operational.hasManualControls'] = 'Campo obrigatório.';
	} else if (manualChoice === 'Sim' && !isRequired(detailOf(operational.hasManualControls))) {
		errors['operational.hasManualControlsDetail'] = 'Descreva os controles manuais existentes.';
	}

	if (!isRequired(operational.mainRisks)) errors['operational.mainRisks'] = 'Campo obrigatório.';
	if (!isRequired(operational.clientImpact)) {
		errors['operational.clientImpact'] = 'Campo obrigatório.';
	}
	if (!operational.operationalImpact) {
		errors['operational.operationalImpact'] = 'Campo obrigatório.';
	}
	if (
		!isRequired(operational.desiredDeadline) ||
		!isFutureOrToday(operational.desiredDeadline, todayISO())
	) {
		errors['operational.desiredDeadline'] = 'Insira um prazo válido';
	}
	if (!operational.perceivedCriticality) {
		errors['operational.perceivedCriticality'] = 'Campo obrigatório.';
	}

	if (toChoice(complementary?.hasProcessDocumentation) === 'Sim') {
		if (!isRequired(detailOf(complementary?.hasProcessDocumentation))) {
			errors['complementary.hasProcessDocumentationDetail'] = 'Detalhe a documentação existente.';
		}
	}
	if (toChoice(complementary?.hasSimilarSolution) === 'Sim') {
		if (!isRequired(detailOf(complementary?.hasSimilarSolution))) {
			errors['complementary.hasSimilarSolutionDetail'] = 'Descreva a solução semelhante.';
		}
	}
	if (toChoice(complementary?.dependsOnOtherAreas) === 'Sim') {
		if (!isRequired(detailOf(complementary?.dependsOnOtherAreas))) {
			errors['complementary.dependsOnOtherAreasDetail'] =
				'Informe quais áreas dependem desta solicitação.';
		}
	}
	if (toChoice(complementary?.handlesRestrictedInfo) === 'Sim') {
		if (!isRequired(detailOf(complementary?.handlesRestrictedInfo))) {
			errors['complementary.handlesRestrictedInfoDetail'] =
				'Detalhe as informações restritas (LGPD).';
		}
	}

	return errors;
}

// Validação de um único campo (blur): reaproveita a validação completa e
// devolve só as chaves do campo — incluindo o par escolha/detalhe quando o
// caminho é um `YesNoDetail` (`operational.hasManualControls` valida junto
// com `operational.hasManualControlsDetail`, e vice-versa).
export function validateEditField(draft: EditableDraft, path: string): Record<string, string> {
	const all = validateEditDraft(draft);
	const keys = path.endsWith(DETAIL_SUFFIX)
		? [path, path.slice(0, -DETAIL_SUFFIX.length)]
		: [path, `${path}${DETAIL_SUFFIX}`];
	const picked: Record<string, string> = {};
	for (const key of keys) {
		if (all[key]) picked[key] = all[key];
	}
	return picked;
}

function toPayloadYesNo(value: YesNoDetail | undefined): YesNoDetail | undefined {
	if (value === undefined) return undefined;
	if (value === false) return false;
	const trimmed = value.trim();
	return trimmed ? trimmed : undefined;
}

// Monta o payload excluindo os imutáveis (`fullName`/`corporateEmail` vêm do
// original mesmo que o draft divirja).
export function toUpdatePayload(
	draft: EditableDraft,
	original: InternalRequestDetail
): UpdateInternalRequestPayload {
	const complementary = draft.complementary;
	const hasProcessDocumentation = toPayloadYesNo(complementary?.hasProcessDocumentation);
	const hasSimilarSolution = toPayloadYesNo(complementary?.hasSimilarSolution);
	const dependsOnOtherAreas = toPayloadYesNo(complementary?.dependsOnOtherAreas);
	const handlesRestrictedInfo = toPayloadYesNo(complementary?.handlesRestrictedInfo);
	const additionalNotes = (complementary?.additionalNotes ?? '').trim() || undefined;
	const hasComplementaryContent =
		hasProcessDocumentation !== undefined ||
		hasSimilarSolution !== undefined ||
		dependsOnOtherAreas !== undefined ||
		handlesRestrictedInfo !== undefined ||
		additionalNotes !== undefined;

	return {
		requester: {
			fullName: original.requester.fullName,
			corporateEmail: original.requester.corporateEmail,
			area: draft.requester.area.trim(),
			department: (draft.requester.department ?? '').trim() || undefined,
			manager: draft.requester.manager.trim(),
			additionalContact: (draft.requester.additionalContact ?? '').trim() || undefined
		},
		demand: {
			title: draft.demand.title.trim(),
			requestType: draft.demand.requestType,
			category: draft.demand.category,
			processName: draft.demand.processName.trim(),
			description: draft.demand.description.trim(),
			problem: draft.demand.problem.trim(),
			expectedResult: draft.demand.expectedResult.trim(),
			justification: draft.demand.justification.trim()
		},
		operational: {
			processDescription: draft.operational.processDescription.trim(),
			processSteps: draft.operational.processSteps.trim(),
			systemsUsed: draft.operational.systemsUsed.trim(),
			executionFrequency: draft.operational.executionFrequency,
			volumetry: draft.operational.volumetry.trim(),
			peopleInvolved: Number(draft.operational.peopleInvolved),
			averageExecutionTime: draft.operational.averageExecutionTime.trim(),
			monthlyEffortHours: Number(draft.operational.monthlyEffortHours),
			hasManualControls:
				draft.operational.hasManualControls === false
					? false
					: (draft.operational.hasManualControls ?? '').trim(),
			mainRisks: draft.operational.mainRisks.trim(),
			clientImpact: draft.operational.clientImpact.trim(),
			operationalImpact: draft.operational.operationalImpact,
			desiredDeadline: draft.operational.desiredDeadline,
			perceivedCriticality: draft.operational.perceivedCriticality
		},
		complementary: hasComplementaryContent
			? {
					...(hasProcessDocumentation !== undefined ? { hasProcessDocumentation } : {}),
					...(hasSimilarSolution !== undefined ? { hasSimilarSolution } : {}),
					...(dependsOnOtherAreas !== undefined ? { dependsOnOtherAreas } : {}),
					...(handlesRestrictedInfo !== undefined ? { handlesRestrictedInfo } : {}),
					...(additionalNotes !== undefined ? { additionalNotes } : {})
				}
			: undefined
	};
}

// Comparador de sujeira por campo, derivado dos payloads normalizados (mesma
// normalização do envio: trim, números e `YesNoDetail` comparados por valor).
export function buildDirtyChecker(
	draft: EditableDraft,
	original: InternalRequestDetail
): (path: string) => boolean {
	const draftPayload = toUpdatePayload(draft, original);
	const basePayload = toUpdatePayload(toEditableDraft(original), original);

	return (path: string): boolean => {
		if (path.endsWith(DETAIL_SUFFIX)) {
			const parent = path.slice(0, -DETAIL_SUFFIX.length);
			return detailOf(getByPath(draftPayload, parent)) !== detailOf(getByPath(basePayload, parent));
		}
		if (YESNO_PATHS.has(path)) {
			return (
				toChoice(getByPath(draftPayload, path) as YesNoDetail | undefined) !==
				toChoice(getByPath(basePayload, path) as YesNoDetail | undefined)
			);
		}
		return (
			String(getByPath(draftPayload, path) ?? '') !== String(getByPath(basePayload, path) ?? '')
		);
	};
}

export function checkDraftDirty(draft: EditableDraft, original: InternalRequestDetail): boolean {
	return (
		JSON.stringify(toUpdatePayload(draft, original)) !==
		JSON.stringify(toUpdatePayload(toEditableDraft(original), original))
	);
}
