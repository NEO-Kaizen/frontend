import { toastState } from '$lib/states/toast.svelte';
import type { SaveOutcome } from '$lib/states/section.svelte';

// Feedback de validação de linha (adicionar/confirmar item) via Toast global.
export function notifyError(message: string): void {
	toastState.add(message, 'error');
}

// Feedback de seção (Salvar) via Toast global. Erros de validação de campo
// continuam inline no próprio campo. Devolve `true` em sucesso para o card
// encadear ações (ex.: limpar arquivos pendentes de assets).
export function notifySectionSave(outcome: SaveOutcome): boolean {
	if (outcome.ok) {
		toastState.add('Alterações salvas com sucesso.', 'success');
		return true;
	}

	toastState.add(outcome.message, 'error');
	return false;
}
