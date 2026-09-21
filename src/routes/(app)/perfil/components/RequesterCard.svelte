<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import { updateMyProfile } from '$lib/services/user.service';
	import { SectionState } from '$lib/states/section.svelte';
	import { untrack } from 'svelte';
	import type { RequesterProfileBlock } from '$lib/types/user';
	import { notifySectionSave } from '$lib/utils/feedback';
	import {
		PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH,
		PROFILE_AREA_MAX_LENGTH,
		PROFILE_DEPARTMENT_MAX_LENGTH,
		PROFILE_MANAGER_MAX_LENGTH
	} from '$lib/utils/validations';
	import { optionalFieldError, requiredFieldError } from '../profile-validation';
	import ProfileCard from './ProfileCard.svelte';
	import ProfileSectionActions from './ProfileSectionActions.svelte';

	interface RequesterForm {
		area: string;
		department: string;
		manager: string;
		additionalContact: string;
	}

	interface Props {
		requester: RequesterProfileBlock | null;
		onSaved: () => void;
	}

	let { requester, onSaved }: Props = $props();

	// Erros só aparecem após a primeira tentativa de salvar — evita o
	// formulário abrir em estado de erro com os campos vazios.
	let submitted = $state(false);

	function toForm(block: RequesterProfileBlock | null): RequesterForm {
		return {
			area: block?.area ?? '',
			department: block?.department ?? '',
			manager: block?.manager ?? '',
			additionalContact: block?.additionalContact ?? ''
		};
	}

	// O estado inicial vem do servidor no primeiro render; `untrack` deixa
	// explícito que a seção não deve ser reidratada quando a prop mudar (o
	// `SectionState` mantém pristine/draft próprios após cada save).
	const initial = untrack(() => toForm(requester));

	const section = new SectionState<RequesterForm>(initial, initial, async (draft) => {
		const result = await updateMyProfile({
			requester: {
				area: draft.area.trim(),
				department: draft.department.trim() || undefined,
				manager: draft.manager.trim(),
				additionalContact: draft.additionalContact.trim() || undefined
			}
		});

		if (!result.ok) return result;

		return { ok: true, data: toForm(result.data.requester) };
	});

	const errors = $derived({
		area: requiredFieldError(section.draft.area, 'a área', PROFILE_AREA_MAX_LENGTH),
		department: optionalFieldError(section.draft.department, PROFILE_DEPARTMENT_MAX_LENGTH),
		manager: requiredFieldError(section.draft.manager, 'o gestor', PROFILE_MANAGER_MAX_LENGTH),
		additionalContact: optionalFieldError(
			section.draft.additionalContact,
			PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH
		)
	});

	const invalid = $derived(Object.values(errors).some(Boolean));

	async function handleSave() {
		submitted = true;

		if (invalid) return;

		if (notifySectionSave(await section.save())) {
			onSaved();
		}
	}

	function handleCancel() {
		submitted = false;
		section.reset();
	}
</script>

<ProfileCard
	title="Dados de solicitante"
	description="Informações usadas nas solicitações que você abre no portal."
>
	{#snippet actions()}
		<ProfileSectionActions
			dirty={section.dirty}
			saving={section.saving}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	{/snippet}

	<div class="requester-fields">
		<Input
			label="Área"
			name="area"
			placeholder="Ex.: Operações"
			maxlength={PROFILE_AREA_MAX_LENGTH}
			required
			bind:value={section.draft.area}
			error={submitted ? errors.area : ''}
		/>

		<Input
			label="Departamento"
			name="department"
			placeholder="Ex.: Atendimento"
			maxlength={PROFILE_DEPARTMENT_MAX_LENGTH}
			bind:value={section.draft.department}
			error={submitted ? errors.department : ''}
		/>

		<Input
			label="Gestor"
			name="manager"
			placeholder="Nome do gestor responsável"
			maxlength={PROFILE_MANAGER_MAX_LENGTH}
			required
			bind:value={section.draft.manager}
			error={submitted ? errors.manager : ''}
		/>

		<Input
			label="Contato adicional"
			name="additionalContact"
			placeholder="Ex.: ramal ou telefone"
			maxlength={PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH}
			bind:value={section.draft.additionalContact}
			error={submitted ? errors.additionalContact : ''}
		/>
	</div>
</ProfileCard>

<style>
	.requester-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
	}

	@media (max-width: 700px) {
		.requester-fields {
			grid-template-columns: 1fr;
		}
	}
</style>
