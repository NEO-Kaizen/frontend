<script lang="ts">
	interface Props {
		isAssignableTriage?: boolean;
		isAssignableMapping?: boolean;
		triageRequirementsMet: boolean;
		mappingRequirementsMet: boolean;
		isSaving: boolean;
		onflagschange?: () => void;
	}

	let {
		isAssignableTriage = $bindable(false),
		isAssignableMapping = $bindable(false),
		triageRequirementsMet,
		mappingRequirementsMet,
		isSaving,
		onflagschange
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
			bind:checked={isAssignableTriage}
			onchange={onflagschange}
			disabled={isSaving || (!triageRequirementsMet && !isAssignableTriage)}
		/>
		<span>
			<strong>Atribuível à triagem</strong>
			{#if !triageRequirementsMet}
				<small>Inclua as permissões exigidas pelo catálogo para habilitar esta opção.</small>
			{/if}
		</span>
	</label>
	<label class="flag-choice">
		<input
			type="checkbox"
			bind:checked={isAssignableMapping}
			onchange={onflagschange}
			disabled={isSaving || (!mappingRequirementsMet && !isAssignableMapping)}
		/>
		<span>
			<strong>Atribuível ao mapeamento</strong>
			{#if !mappingRequirementsMet}
				<small>Inclua as permissões exigidas pelo catálogo para habilitar esta opção.</small>
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
