<script lang="ts">
	type SelectOption = {
		value: string;
		label: string;
	};

	interface Props {
		label?: string;
		placeholder?: string;
		value?: string;
		options: SelectOption[];
		required?: boolean;
		disabled?: boolean;
		error?: string;
		name?: string;
		id?: string;
		onchange?: () => void;
	}

	let {
		label = '',
		placeholder = 'Selecione',
		value = $bindable(''),
		options,
		required = false,
		disabled = false,
		error = '',
		name,
		id,
		onchange
	}: Props = $props();

	const uid = $props.id();
	const selectId = $derived(id ?? uid);
</script>

<div class="select-field">
	{#if label}
		<label for={selectId}
			>{label}{#if required}<span class="required-mark" aria-hidden="true">*</span>{/if}</label
		>
	{/if}

	<div class="select-wrapper">
		<select
			id={selectId}
			{name}
			{required}
			{disabled}
			bind:value
			{onchange}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? `${selectId}-error` : undefined}
			class:error={Boolean(error)}
		>
			<option value="" disabled>{placeholder}</option>
			{#each options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>

		<span class="select-icon" aria-hidden="true">
			<span class="material-symbols-outlined md">arrow_drop_down</span>
		</span>
	</div>

	{#if error}
		<p id={`${selectId}-error`} class="error-message">
			{error}
		</p>
	{/if}
</div>

<style>
	.select-field {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.select-wrapper {
		position: relative;
	}

	label {
		font: var(--label);
		color: var(--black);
	}

	.required-mark {
		margin-left: 2px;
		color: var(--status-red);
	}

	select {
		width: 100%;
		box-sizing: border-box;
		padding: var(--spacing-sm);
		padding-right: 40px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font: var(--paragrafo);
		background-color: var(--white);
		color: var(--text-color-primary);
		outline: none;
		transition: var(--transition-default);
		appearance: none;
		cursor: pointer;
	}

	select:focus {
		border-color: var(--primary-color);
	}

	select:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	select.error {
		border-color: var(--status-red);
	}

	select:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.select-icon {
		position: absolute;
		right: var(--spacing-sm);
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		pointer-events: none;
		color: var(--gray);
	}

	.error-message {
		margin: 0;
		margin-top: 4px;
		color: var(--status-red);
		font: var(--label);
	}
</style>
