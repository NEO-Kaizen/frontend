<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		id: string;
		label: string;
		type?: 'text' | 'email' | 'password';
		value?: string;
		placeholder?: string;
		autocomplete?: AutoFill;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		iconName?: IconName;
		oninput?: () => void;
	}

	let {
		id,
		label,
		type = 'text',
		value = $bindable(''),
		placeholder,
		autocomplete,
		required = false,
		disabled = false,
		error,
		iconName,
		oninput
	}: Props = $props();

	let isPasswordVisible = $state(false);

	const inputType = $derived(type === 'password' && isPasswordVisible ? 'text' : type);
	const errorId = $derived(`${id}-error`);
</script>

<div class="field">
	<label for={id}>{label}</label>

	<div class="input-wrapper" class:has-error={!!error}>
		{#if iconName}
			<Icon {iconName} iconSize="sm" />
		{/if}

		<input
			{id}
			type={inputType}
			bind:value
			{placeholder}
			{autocomplete}
			{required}
			{disabled}
			{oninput}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? errorId : undefined}
		/>

		{#if type === 'password'}
			<button
				type="button"
				class="toggle-password"
				onclick={() => (isPasswordVisible = !isPasswordVisible)}
				aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
				aria-pressed={isPasswordVisible}
			>
				<Icon iconName={isPasswordVisible ? 'visibilityOff' : 'visibility'} iconSize="sm" />
			</button>
		{/if}
	</div>

	{#if error}
		<p id={errorId} class="error-message" role="alert">{error}</p>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0 var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		transition: var(--transition-default);
	}

	.input-wrapper:focus-within {
		border-color: var(--secondary-color);
	}

	.input-wrapper.has-error {
		border-color: var(--status-red);
	}

	.input-wrapper :global(.material-symbols-outlined) {
		color: var(--gray);
	}

	input {
		flex: 1;
		min-height: 44px;
		border: none;
		outline: none;
		background: transparent;
		font: var(--paragrafo);
		color: var(--black);
	}

	input::placeholder {
		color: var(--gray);
	}

	.toggle-password {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--gray);
	}

	.toggle-password:hover {
		color: var(--primary-color);
	}

	.toggle-password:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.error-message {
		color: var(--status-red);
		font-size: 14px;
	}
</style>
