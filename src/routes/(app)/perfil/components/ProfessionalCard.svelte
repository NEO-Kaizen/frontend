<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import { updateMyProfile } from '$lib/services/user.service';
	import { SectionState } from '$lib/states/section.svelte';
	import { untrack } from 'svelte';
	import type { PortalCategory } from '$lib/types/portal-config';
	import type { ProfessionalProfileBlock } from '$lib/types/user';
	import { notifyError, notifySectionSave } from '$lib/utils/feedback';
	import {
		PROFILE_JOB_TITLE_MAX_LENGTH,
		PROFILE_SPECIALTY_MAX_LENGTH
	} from '$lib/utils/validations';
	import { requiredFieldError } from '../profile-validation';
	import ProfileCard from './ProfileCard.svelte';
	import ProfileSectionActions from './ProfileSectionActions.svelte';

	interface ProfessionalForm {
		jobTitle: string;
		specialties: string[];
		attendedCategoryIds: number[];
	}

	interface Props {
		professional: ProfessionalProfileBlock | null;
		categories: PortalCategory[];
		onSaved: () => void;
	}

	let { professional, categories, onSaved }: Props = $props();

	// Erros só aparecem após a primeira tentativa de salvar — evita o
	// formulário abrir em estado de erro com os campos vazios.
	let submitted = $state(false);

	function toForm(block: ProfessionalProfileBlock | null): ProfessionalForm {
		return {
			jobTitle: block?.jobTitle ?? '',
			specialties: block?.specialties ?? [],
			attendedCategoryIds: block?.attendedCategoryIds ?? []
		};
	}

	// Estado inicial do servidor; `untrack` documenta que a seção não reidrata
	// com a prop — pristine/draft são geridos pelo `SectionState`.
	const initial = untrack(() => toForm(professional));

	const section = new SectionState<ProfessionalForm>(initial, initial, async (draft) => {
		const result = await updateMyProfile({
			professional: {
				jobTitle: draft.jobTitle.trim(),
				specialties: draft.specialties,
				attendedCategoryIds: draft.attendedCategoryIds,
				// `notes` não é editável aqui (campo administrativo), mas o
				// upsert do backend grava `?? null` — reenviamos o valor atual
				// para não apagar observações existentes ao salvar o card.
				notes: professional?.notes ?? undefined
			}
		});

		if (!result.ok) return result;

		return { ok: true, data: toForm(result.data.professional) };
	});

	const jobTitleError = $derived(
		requiredFieldError(section.draft.jobTitle, 'o cargo', PROFILE_JOB_TITLE_MAX_LENGTH)
	);

	const specialtiesError = $derived.by(() => {
		if (section.draft.specialties.length === 0) return 'Informe ao menos uma especialidade.';
		if (section.draft.specialties.some((item) => item.length > PROFILE_SPECIALTY_MAX_LENGTH)) {
			return `Cada especialidade deve ter no máximo ${PROFILE_SPECIALTY_MAX_LENGTH} caracteres.`;
		}
		return '';
	});

	const categoriesError = $derived(
		section.draft.attendedCategoryIds.length === 0
			? 'Selecione ao menos uma categoria atendida.'
			: ''
	);

	const invalid = $derived(Boolean(jobTitleError || specialtiesError || categoriesError));

	function notifyDuplicateSpecialty(value: string) {
		notifyError(`A especialidade "${value}" já foi adicionada.`);
	}

	function toggleCategory(id: number) {
		const selected = section.draft.attendedCategoryIds;

		section.draft = {
			...section.draft,
			attendedCategoryIds: selected.includes(id)
				? selected.filter((value) => value !== id)
				: [...selected, id]
		};
	}

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
	title="Dados profissionais"
	description="Informações exclusivas do perfil Analista, usadas na triagem e priorização."
>
	{#snippet actions()}
		<ProfileSectionActions
			dirty={section.dirty}
			saving={section.saving}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	{/snippet}

	<div class="professional-fields">
		<Input
			label="Cargo"
			name="jobTitle"
			placeholder="Ex.: Analista de Processos"
			maxlength={PROFILE_JOB_TITLE_MAX_LENGTH}
			required
			bind:value={section.draft.jobTitle}
			error={submitted ? jobTitleError : ''}
		/>

		<TagInput
			label="Especialidades"
			hint="Pressione Enter ou use + para adicionar."
			placeholder="Ex.: Automação"
			maxlength={PROFILE_SPECIALTY_MAX_LENGTH}
			bind:value={section.draft.specialties}
			error={submitted ? specialtiesError : ''}
			onDuplicate={notifyDuplicateSpecialty}
		/>

		<fieldset class="categories">
			<legend>Formatos de demanda atendidos</legend>

			<div class="category-options">
				{#each categories as category (category.id)}
					<label class="category-option">
						<input
							type="checkbox"
							checked={section.draft.attendedCategoryIds.includes(category.id)}
							onchange={() => toggleCategory(category.id)}
						/>
						<span>{category.name}</span>
					</label>
				{/each}
			</div>

			{#if submitted && categoriesError}
				<p class="field-error" role="alert">{categoriesError}</p>
			{/if}
		</fieldset>
	</div>
</ProfileCard>

<style>
	.professional-fields {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.categories {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin: 0;
		padding: 0;
		border: none;
	}

	.categories legend {
		padding: 0;
		font: var(--label);
		color: var(--black);
	}

	.category-options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-sm) var(--spacing-md);
	}

	.category-option {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font: var(--paragrafo);
		color: var(--black);
	}

	.category-option input {
		width: 16px;
		height: 16px;
		accent-color: var(--primary-color);
	}

	.field-error {
		margin: 0;
		color: var(--status-red);
		font: var(--label);
		font-size: 12px;
	}

	@media (max-width: 700px) {
		.category-options {
			grid-template-columns: 1fr;
		}
	}
</style>
