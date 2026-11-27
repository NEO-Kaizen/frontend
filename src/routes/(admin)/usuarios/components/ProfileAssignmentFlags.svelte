<script lang="ts">
	interface Props {
		isAssignableTriage: boolean;
		isAssignableMapping: boolean;
		triageMissingLabels: readonly string[];
		mappingMissingLabels: readonly string[];
		isSaving: boolean;
		onflagchange: (flag: 'isAssignableTriage' | 'isAssignableMapping', checked: boolean) => boolean;
	}

	let {
		isAssignableTriage,
		isAssignableMapping,
		triageMissingLabels,
		mappingMissingLabels,
		isSaving,
		onflagchange
	}: Props = $props();
</script>

<section class="form-section" aria-labelledby="flags-title">
	<div class="section-heading">
		<div>
			<h4 id="flags-title">Disponibilidade para atribuição</h4>
			<p>As opções seguem os predicados definidos no catálogo de permissões.</p>
		</div>
	</div>
	<label class="flag-choice">
		<input
			type="checkbox"
			checked={isAssignableTriage}
			disabled={isSaving}
			onchange={(event) => {
				const accepted = onflagchange('isAssignableTriage', event.currentTarget.checked);
				if (!accepted) event.currentTarget.checked = isAssignableTriage;
			}}
		/>
		<span>
			<strong>Atribuível à triagem</strong>
			{#if triageMissingLabels.length > 0}
				<small>
					{isAssignableTriage
						? `Faltam as permissões exigidas: ${triageMissingLabels.join(', ')}.`
						: `Ao marcar, incluiremos automaticamente: ${triageMissingLabels.join(', ')}.`}
				</small>
			{/if}
		</span>
	</label>
	<label class="flag-choice">
		<input
			type="checkbox"
			checked={isAssignableMapping}
			disabled={isSaving}
			onchange={(event) => {
				const accepted = onflagchange('isAssignableMapping', event.currentTarget.checked);
				if (!accepted) event.currentTarget.checked = isAssignableMapping;
			}}
		/>
		<span>
			<strong>Atribuível ao mapeamento</strong>
			{#if mappingMissingLabels.length > 0}
				<small>
					{isAssignableMapping
						? `Faltam as permissões exigidas: ${mappingMissingLabels.join(', ')}.`
						: `Ao marcar, incluiremos automaticamente: ${mappingMissingLabels.join(', ')}.`}
				</small>
			{/if}
		</span>
	</label>
</section>

<style>
	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}
	.section-heading h4 {
		margin: 0 0 4px;
		color: var(--heading-color);
		font: var(--h4);
	}
	.section-heading p {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
	}
	.flag-choice {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		min-width: 0;
		cursor: pointer;
	}
	.flag-choice > span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.flag-choice strong {
		color: var(--black);
		font: var(--label);
	}
	.flag-choice small {
		color: var(--gray);
		font-size: 12px;
	}
</style>
