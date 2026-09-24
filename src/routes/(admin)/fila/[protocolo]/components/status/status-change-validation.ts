import { isRequired } from '$lib/utils/validations';

// Rascunho do modal "Alterar Status" (`PATCH /requests/:protocol/status` §3.3).
// Tudo string para os inputs controlados aceitarem campo vazio.
export interface StatusChangeDraft {
	targetStatus: string;
	justification: string;
}

export const STATUS_CHANGE_JUSTIFICATION_MAXLENGTH = 4000;

export function emptyStatusChangeDraft(): StatusChangeDraft {
	return { targetStatus: '', justification: '' };
}

// Valida alvo (precisa estar na lista derivada do PortalConfig para o perfil) e
// justificativa obrigatória (1..4000) — todo `status change` exige justificativa.
export function validateStatusChange(
	draft: StatusChangeDraft,
	targets: { value: string; label: string }[]
): Record<string, string> {
	const errors: Record<string, string> = {};

	if (!isRequired(draft.targetStatus)) {
		errors['targetStatus'] = 'Selecione o novo status.';
	} else if (!targets.some((option) => option.value === draft.targetStatus)) {
		errors['targetStatus'] = 'Status selecionado não está disponível para o seu perfil.';
	}

	const justification = draft.justification.trim();
	if (!isRequired(justification)) {
		errors['justification'] = 'Informe a justificativa (1..4000 caracteres).';
	} else if (justification.length > STATUS_CHANGE_JUSTIFICATION_MAXLENGTH) {
		errors['justification'] = 'Limite de 4000 caracteres excedido.';
	}

	return errors;
}
