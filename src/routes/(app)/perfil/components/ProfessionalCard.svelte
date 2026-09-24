<script lang="ts">
	import type { PortalCategory } from '$lib/types/portal-config';
	import type { ProfessionalProfileBlock } from '$lib/types/user';
	import ProfileCard from './ProfileCard.svelte';

	interface Props {
		professional: ProfessionalProfileBlock | null;
		categories: PortalCategory[];
	}

	let { professional, categories }: Props = $props();

	const categoryNames = $derived(
		(professional?.attendedCategoryIds ?? []).map(
			(id) => categories.find((category) => category.id === id)?.name ?? `Categoria #${id}`
		)
	);

	function display(value: string | null | undefined): string {
		return value?.trim() || '---';
	}
</script>

<ProfileCard
	title="Dados profissionais"
	description="Informações do perfil Analista administradas pela equipe responsável."
>
	<div class="professional-fields">
		<div class="readonly-field">
			<span class="readonly-label">Cargo</span>
			<p class="readonly-value">{display(professional?.jobTitle)}</p>
		</div>

		<div class="readonly-field full-row">
			<span class="readonly-label">Especialidades</span>
			{#if professional?.specialties.length}
				<ul class="tag-list" aria-label="Especialidades">
					{#each professional.specialties as specialty (specialty)}
						<li>{specialty}</li>
					{/each}
				</ul>
			{:else}
				<p class="readonly-value">---</p>
			{/if}
		</div>

		<div class="readonly-field full-row">
			<span class="readonly-label">Categorias atendidas</span>
			{#if categoryNames.length}
				<ul class="tag-list" aria-label="Categorias atendidas">
					{#each categoryNames as category (category)}
						<li>{category}</li>
					{/each}
				</ul>
			{:else}
				<p class="readonly-value">---</p>
			{/if}
		</div>

		<div class="readonly-field full-row">
			<span class="readonly-label">Observações administrativas</span>
			<p class="readonly-value">{display(professional?.notes)}</p>
		</div>
	</div>
</ProfileCard>

<style>
	.professional-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
	}

	.readonly-field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--background-color);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		min-height: 42px;
		justify-content: center;
	}

	.full-row {
		grid-column: 1 / -1;
	}

	.readonly-label {
		font: var(--label);
		color: var(--black);
		font-size: 12px;
	}

	.readonly-value {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
		white-space: pre-wrap;
	}

	.tag-list {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin: 0;
		padding: 0;
	}

	.tag-list li {
		padding: 4px var(--spacing-sm);
		border-radius: 999px;
		background-color: var(--tint);
		color: var(--primary-color);
		font: var(--label);
		font-size: 12px;
	}

	@media (max-width: 700px) {
		.professional-fields {
			grid-template-columns: 1fr;
		}

		.full-row {
			grid-column: auto;
		}
	}
</style>
