<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { PortalCategory } from '$lib/types/portal-config';
	import { notifyError } from '$lib/utils/feedback';
	import {
		PROFILE_JOB_TITLE_MAX_LENGTH,
		PROFILE_NOTES_MAX_LENGTH,
		PROFILE_SPECIALTY_MAX_LENGTH
	} from '$lib/utils/validations';

	interface Props {
		categories: PortalCategory[];
		jobTitle?: string;
		specialties?: string[];
		attendedCategoryIds?: number[];
		notes?: string;
		jobTitleError?: string;
		specialtiesError?: string;
		categoriesError?: string;
		notesError?: string;
		disabled?: boolean;
	}

	let {
		categories,
		jobTitle = $bindable(''),
		specialties = $bindable([]),
		attendedCategoryIds = $bindable([]),
		notes = $bindable(''),
		jobTitleError = '',
		specialtiesError = '',
		categoriesError = '',
		notesError = '',
		disabled = false
	}: Props = $props();

	function toggleCategory(id: number) {
		attendedCategoryIds = attendedCategoryIds.includes(id)
			? attendedCategoryIds.filter((value) => value !== id)
			: [...attendedCategoryIds, id];
	}
</script>

<section class="professional-section" aria-labelledby="professional-fields-title">
	<div class="section-heading">
		<h4 id="professional-fields-title">Dados profissionais do Analista</h4>
		<p>Informações usadas na atribuição e no acompanhamento das solicitações.</p>
	</div>

	<Input
		label="Cargo *"
		name="jobTitle"
		placeholder="Ex.: Analista de Processos"
		maxlength={PROFILE_JOB_TITLE_MAX_LENGTH}
		bind:value={jobTitle}
		error={jobTitleError}
		{disabled}
	/>

	<TagInput
		label="Especialidades *"
		hint="Pressione Enter ou use + para adicionar."
		placeholder="Ex.: Automação"
		maxlength={PROFILE_SPECIALTY_MAX_LENGTH}
		bind:value={specialties}
		error={specialtiesError}
		onDuplicate={(value) => notifyError(`A especialidade "${value}" já foi adicionada.`)}
		{disabled}
	/>

	<fieldset class="categories" {disabled}>
		<legend>Categorias atendidas *</legend>
		<div class="category-options">
			{#each categories as category (category.id)}
				<label class="category-option">
					<input
						type="checkbox"
						checked={attendedCategoryIds.includes(category.id)}
						onchange={() => toggleCategory(category.id)}
					/>
					<span>{category.name}</span>
				</label>
			{/each}
		</div>
		{#if categoriesError}
			<p class="field-error" role="alert">{categoriesError}</p>
		{/if}
	</fieldset>

	<Textarea
		label="Observações administrativas"
		name="professionalNotes"
		placeholder="Informações relevantes sobre atuação ou disponibilidade"
		maxlength={PROFILE_NOTES_MAX_LENGTH}
		bind:value={notes}
		error={notesError}
		{disabled}
	/>
</section>

<style>
	.professional-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}

	.section-heading h4,
	.section-heading p {
		margin: 0;
	}

	.section-heading h4 {
		font: var(--h4);
		color: var(--heading-color);
	}

	.section-heading p {
		margin-top: var(--spacing-xs);
		font: var(--paragrafo);
		font-size: 13px;
		color: var(--gray);
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

	@media (max-width: 620px) {
		.category-options {
			grid-template-columns: 1fr;
		}
	}
</style>
