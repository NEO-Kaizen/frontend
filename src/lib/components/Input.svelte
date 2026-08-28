<script lang="ts">
	import type { IconName } from '$lib/types/icons';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type InputType =
		'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date' | 'datetime-local';

	interface BaseProps extends Omit<
		HTMLInputAttributes,
		'type' | 'value' | 'placeholder' | 'required' | 'disabled' | 'name' | 'id'
	> {
		type?: InputType;
		label?: string;
		placeholder?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		name?: string;
		id?: string;
		maxlength?: number;
		icon?: IconName;
	}

	type ActionProps =
		| {
				actionIcon: IconName;
				actionLabel: string;
				onAction?: () => void;
		  }
		| {
				actionIcon?: undefined;
				actionLabel?: never;
				onAction?: never;
		  };

	type Props = BaseProps & ActionProps;

	let {
		type = 'text',
		label = '',
		placeholder = '',
		value = $bindable(''),
		required = false,
		disabled = false,
		error = '',
		name,
		id,
		maxlength,
		icon,
		actionIcon,
		actionLabel,
		onAction,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? uid);
</script>

<div class="input-field">
	{#if label}
		<label for={inputId}>{label}</label>
	{/if}

	<div class="input-wrapper">
		{#if icon}
			<span class="leading-icon" aria-hidden="true">
				<Icon iconName={icon} iconSize="md" />
			</span>
		{/if}

		<input
			{...restProps}
			id={inputId}
			{name}
			{type}
			{placeholder}
			{required}
			{disabled}
			{maxlength}
			bind:value
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? `${inputId}-error` : undefined}
			class:error={Boolean(error)}
			class:has-leading-icon={Boolean(icon)}
			class:has-action-icon={Boolean(actionIcon)}
		/>

		{#if maxlength && type !== 'number' && type !== 'date' && type !== 'datetime-local'}
			<span class="char-counter" aria-hidden="true">
				{value.length}/{maxlength}
			</span>
		{/if}

		{#if actionIcon}
			<button
				class="action-button"
				type="button"
				onclick={onAction}
				{disabled}
				aria-label={actionLabel}
			>
				<Icon iconName={actionIcon} iconSize="md" />
			</button>
		{/if}
	</div>

	{#if error}
		<p id={`${inputId}-error`} class="error-message">
			{error}
		</p>
	{/if}
</div>

<style>
	.input-field {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.input-wrapper {
		position: relative;
	}

	label {
		font: var(--label);
		color: var(--black);
	}

	input {
		width: 100%;
		box-sizing: border-box;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font: var(--paragrafo);
		background-color: var(--white);
		color: var(--rich-black);
		outline: none;
		transition: var(--transition-default);
	}

	input.has-leading-icon {
		padding-left: 48px;
	}

	input.has-action-icon {
		padding-right: 48px;
	}

	input::placeholder {
		color: var(--gray);
	}

	.leading-icon {
		position: absolute;
		left: var(--spacing-md);
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		pointer-events: none;
		color: var(--gray);
	}

	.char-counter {
		position: absolute;
		right: var(--spacing-sm);
		bottom: 6px;
		font-size: 12px;
		line-height: 1;
		color: var(--gray);
		pointer-events: none;
		opacity: 0;
		transition: var(--transition-default);
	}

	.input-wrapper:focus-within .char-counter {
		opacity: 1;
	}

	.action-button {
		position: absolute;
		right: var(--spacing-sm);
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		border: none;
		background: none;
		color: var(--gray);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.action-button:hover {
		color: var(--primary-color);
	}

	.action-button:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.action-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	input:focus {
		border-color: var(--primary-color);
	}

	input:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	input.error {
		border-color: var(--status-red);
	}

	input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	input[type='password']::-ms-reveal {
		display: none;
	}

	input[type='password']::-webkit-credentials-auto-fill-button {
		visibility: hidden;
		pointer-events: none;
	}

	.error-message {
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		margin: 0;
		margin-top: 4px;
		color: var(--status-red);
		font: var(--label);
	}
</style>
