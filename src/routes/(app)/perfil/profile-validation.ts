import { isRequired } from '$lib/utils/validations';

// Mensagens de validação dos formulários de "Meus dados". Ficam separadas dos
// predicados puros de `$lib/utils/validations` porque acoplam o texto de UI à
// regra de tamanho do backend.
export function requiredFieldError(value: string, label: string, maxLength: number): string {
	const trimmed = value.trim();

	if (!isRequired(trimmed)) {
		return `Informe ${label}.`;
	}

	if (trimmed.length > maxLength) {
		return `Máximo de ${maxLength} caracteres.`;
	}

	return '';
}

export function optionalFieldError(value: string, maxLength: number): string {
	return value.trim().length > maxLength ? `Máximo de ${maxLength} caracteres.` : '';
}
