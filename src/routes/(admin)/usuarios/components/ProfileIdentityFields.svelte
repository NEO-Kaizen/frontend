<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import { PROFILE_DESCRIPTION_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH } from '$lib/utils/validations';

	interface Props {
		name?: string;
		description?: string;
		nameError?: string;
		disabled?: boolean;
		showDuplicateHelper?: boolean;
	}

	let {
		name = $bindable(''),
		description = $bindable(''),
		nameError = '',
		disabled = false,
		showDuplicateHelper = false
	}: Props = $props();
</script>

<div class="identity-fields">
	{#if showDuplicateHelper}
		<p class="helper">
			A cópia herda a composição e as flags do perfil de origem; você pode alterar o nome e a
			descrição.
		</p>
	{/if}
	<div class="form-row">
		<Input
			label="Nome do perfil *"
			maxlength={PROFILE_NAME_MAX_LENGTH}
			required
			bind:value={name}
			error={nameError}
			{disabled}
		/>
		<label class="field">
			<span>Descrição</span>
			<textarea
				bind:value={description}
				maxlength={PROFILE_DESCRIPTION_MAX_LENGTH}
				rows="2"
				{disabled}></textarea>
		</label>
	</div>
</div>

<style>
	.identity-fields {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		color: var(--heading-color);
		font: var(--label);
	}
	.field textarea {
		width: 100%;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
		color: var(--black);
		font: var(--paragrafo);
	}
	.field textarea:focus {
		outline: 2px solid var(--secondary-color);
		outline-offset: 1px;
	}
	.helper {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
	}
	@media (max-width: 620px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
