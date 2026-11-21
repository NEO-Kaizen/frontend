import {
	CATEGORY_OPTIONS,
	CRITICALITY_OPTIONS,
	FREQUENCY_OPTIONS,
	IMPACT_OPTIONS,
	REQUEST_TYPE_OPTIONS
} from '$lib/types/request';
import type { PendingFieldValue } from '$lib/types/pendency';

// Controle adequado por campo (contrato v0.5 §15): reutiliza os tipos do
// catálogo em vez de tratar tudo como string. Chaves fora da lista caem em
// `text` (ou `textarea`, quando o conteúdo esperado é longo).
export type RequesterFieldKind =
	| 'number'
	| 'date'
	| 'operationalImpact'
	| 'perceivedCriticality'
	| 'frequency'
	| 'requestType'
	| 'category'
	| 'yesno'
	| 'textarea'
	| 'text';

const NUMBER_FIELDS = new Set(['operational.peopleInvolved', 'operational.monthlyEffortHours']);

const TEXTAREA_FIELDS = new Set([
	'demand.description',
	'demand.problem',
	'demand.expectedResult',
	'demand.justification',
	'operational.processDescription',
	'operational.processSteps',
	'operational.systemsUsed',
	'operational.volumetry',
	'operational.averageExecutionTime',
	'operational.mainRisks',
	'operational.clientImpact',
	'complementary.additionalNotes',
	'requester.additionalContact'
]);

// Campos `false | string` ("Não" / "Sim + detalhamento").
const YESNO_FIELDS = new Set([
	'operational.hasManualControls',
	'complementary.hasProcessDocumentation',
	'complementary.hasSimilarSolution',
	'complementary.dependsOnOtherAreas',
	'complementary.handlesRestrictedInfo'
]);

export function getFieldInputKind(fieldKey: string): RequesterFieldKind {
	if (NUMBER_FIELDS.has(fieldKey)) return 'number';
	if (fieldKey === 'operational.desiredDeadline') return 'date';
	if (fieldKey === 'operational.operationalImpact') return 'operationalImpact';
	if (fieldKey === 'operational.perceivedCriticality') return 'perceivedCriticality';
	if (fieldKey === 'operational.executionFrequency') return 'frequency';
	if (fieldKey === 'demand.requestType') return 'requestType';
	if (fieldKey === 'demand.category') return 'category';
	if (YESNO_FIELDS.has(fieldKey)) return 'yesno';
	if (TEXTAREA_FIELDS.has(fieldKey)) return 'textarea';
	return 'text';
}

export function getFieldEnumOptions(
	kind: RequesterFieldKind
): { value: string; label: string }[] | null {
	switch (kind) {
		case 'operationalImpact':
			return IMPACT_OPTIONS;
		case 'perceivedCriticality':
			return CRITICALITY_OPTIONS;
		case 'frequency':
			return FREQUENCY_OPTIONS;
		case 'requestType':
			return REQUEST_TYPE_OPTIONS;
		case 'category':
			return CATEGORY_OPTIONS;
		default:
			return null;
	}
}

// Exibição do valor atual (snapshot do analista) e do valor respondido.
export function formatFieldValue(value: PendingFieldValue): string {
	if (value === null) return '---';
	if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
	return String(value);
}

// Valor inicial do input a partir do que já foi respondido (reabertura mostra
// o campo vazio — o backend limpa `correctedValue` no `reopen`).
export function toFieldDraft(value: PendingFieldValue): string {
	if (value === null || typeof value === 'boolean') return '';
	return String(value);
}

export interface ParsedFieldValue {
	ok: boolean;
	value?: PendingFieldValue;
	error?: string;
}

// Converte o texto do input para o tipo esperado pelo campo, preservando o
// tipo escalar (`string | number | boolean | null`) no `correctedValue`.
export function parseFieldInput(kind: RequesterFieldKind, raw: string): ParsedFieldValue {
	const trimmed = raw.trim();

	if (kind === 'number') {
		if (!trimmed) return { ok: false, error: 'Informe um valor numérico.' };
		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed)) return { ok: false, error: 'Informe um valor numérico.' };
		if (parsed < 0) return { ok: false, error: 'O valor não pode ser negativo.' };
		return { ok: true, value: parsed };
	}

	if (kind === 'date') {
		if (!trimmed) return { ok: false, error: 'Informe a data (ano-mês-dia).' };
		if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || Number.isNaN(new Date(trimmed).getTime())) {
			return { ok: false, error: 'Informe uma data válida (ano-mês-dia).' };
		}
		return { ok: true, value: trimmed };
	}

	if (
		kind === 'operationalImpact' ||
		kind === 'perceivedCriticality' ||
		kind === 'frequency' ||
		kind === 'requestType' ||
		kind === 'category'
	) {
		if (!trimmed) return { ok: false, error: 'Selecione uma opção.' };
		const options = getFieldEnumOptions(kind) ?? [];
		if (!options.some((option) => option.value === trimmed)) {
			return { ok: false, error: 'Selecione uma opção válida.' };
		}
		return { ok: true, value: trimmed };
	}

	if (!trimmed) return { ok: false, error: 'Informe o valor corrigido.' };
	return { ok: true, value: trimmed };
}

// Resposta `Sim/Não`: `Não` → `false`; `Sim` → detalhamento (`''` = "Sim" sem
// detalhe, conforme o contrato `YesNoDetail`).
export function parseYesNoInput(choice: 'yes' | 'no' | '', detail: string): ParsedFieldValue {
	if (choice === '') return { ok: false, error: 'Selecione "Sim" ou "Não".' };
	if (choice === 'no') return { ok: true, value: false };
	return { ok: true, value: detail.trim() };
}
