import type { PortalStatus } from '$lib/types/portal-config';
import { isRequired } from '$lib/utils/validations';

// Rascunho do modal "Alterar Status" (`PATCH /requests/:protocol/status` §3.3).
// Tudo string para os inputs controlados aceitarem campo vazio.
export interface StatusChangeDraft {
	targetStatus: string;
	justification: string;
	lastTechnicalMessage: string;
}

export const STATUS_CHANGE_JUSTIFICATION_MAXLENGTH = 4000;

export function emptyStatusChangeDraft(): StatusChangeDraft {
	return { targetStatus: '', justification: '', lastTechnicalMessage: '' };
}

// Valida alvo (precisa estar na lista derivada do PortalConfig para o perfil),
// justificativa obrigatória e retorno público quando o destino é público.
export function validateStatusChange(
	draft: StatusChangeDraft,
	targets: { value: string; label: string }[],
	statuses: PortalStatus[]
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

	const selectedStatus = statuses.find((status) => status.id === Number(draft.targetStatus));
	const targetIsPublic = !errors['targetStatus'] && selectedStatus?.isPublic === true;
	if (targetIsPublic) {
		const lastTechnicalMessage = (draft.lastTechnicalMessage ?? '').trim();
		if (!isRequired(lastTechnicalMessage)) {
			errors['lastTechnicalMessage'] = 'Informe o retorno ao solicitante (1..4000 caracteres).';
		} else if (lastTechnicalMessage.length > 4000) {
			errors['lastTechnicalMessage'] = 'Limite de 4000 caracteres excedido.';
		}
	}

	return errors;
}
