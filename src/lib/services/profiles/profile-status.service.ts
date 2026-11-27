import type { Profile } from '$lib/types/profile';

export interface ProfileStatusRestriction {
	blocked: boolean;
	/** Mensagem curta usada na tabela (nota + aria-describedby). */
	tableMessage: string;
	/** Mensagem explicativa usada no diálogo de confirmação. */
	dialogMessage: string;
}

type StatusProfile = Pick<Profile, 'isRoot' | 'isActive' | 'userCount'>;

/**
 * Regra única de bloqueio de ativação/desativação de perfil, compartilhada pela
 * tabela, pelo diálogo e pelo guard de confirmação.
 */
export function profileStatusRestriction(
	profile: StatusProfile,
	options: { canEdit: boolean }
): ProfileStatusRestriction {
	if (!options.canEdit) {
		return {
			blocked: true,
			tableMessage: 'Seu perfil não tem autoridade suficiente para alterar este perfil.',
			dialogMessage: ''
		};
	}

	if (!profile.isActive) {
		return { blocked: false, tableMessage: '', dialogMessage: '' };
	}

	if (profile.isRoot) {
		return {
			blocked: true,
			tableMessage: 'O perfil Admin Root não pode ser desativado.',
			dialogMessage: 'O perfil Admin Root não pode ser desativado.'
		};
	}

	if (profile.userCount > 0) {
		const singular = profile.userCount === 1;
		return {
			blocked: true,
			tableMessage: singular
				? 'Não é possível desativar: 1 usuário ainda utiliza este perfil.'
				: `Não é possível desativar: ${profile.userCount} usuários ainda utilizam este perfil.`,
			dialogMessage: singular
				? 'Este perfil não pode ser desativado enquanto 1 usuário estiver associado.'
				: `Este perfil não pode ser desativado enquanto ${profile.userCount} usuários estiverem associados.`
		};
	}

	return { blocked: false, tableMessage: '', dialogMessage: '' };
}

export function canChangeProfileStatus(
	profile: StatusProfile,
	options: { canEdit: boolean }
): boolean {
	return !profileStatusRestriction(profile, options).blocked;
}
