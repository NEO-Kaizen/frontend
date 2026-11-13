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
		readonly?: boolean;
		error?: string;
		dirty?: boolean;
		name?: string;
		id?: string;
		maxlength?: number;
		icon?: IconName;
		prefix?: string;
		hint?: string;
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

	// Botão de ação à esquerda do campo (ex.: "+" para adicionar itens). Quando
	// informado, tem precedência sobre `prefix`/`icon` na área de destaque.
	type LeadingActionProps =
		| {
				leadingActionIcon: IconName;
				leadingActionLabel: string;
				onLeadingAction?: () => void;
		  }
		| {
				leadingActionIcon?: undefined;
				leadingActionLabel?: never;
				onLeadingAction?: never;
		  };

	type Props = BaseProps & ActionProps & LeadingActionProps;

	let {
		type = 'text',
		label = '',
		placeholder = '',
		value = $bindable(''),
		required = false,
		disabled = false,
		readonly = false,
		error = '',
		dirty = false,
		name,
		id,
		maxlength,
		icon,
		prefix,
		actionIcon,
		actionLabel,
		onAction,
		hint,
		leadingActionIcon,
		leadingActionLabel,
		onLeadingAction,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? uid);

	function getValue() {
		return value == null ? '' : String(value);
	}

	function setValue(newValue: string | number | null | undefined) {
		value = newValue == null ? '' : String(newValue);
	}
</script>

<div class="input-field">
	{#if label}
		<label for={inputId}>
			{label}{#if required}<span class="required-mark" aria-hidden="true">*</span>{/if}
			{#if hint}
				<span class="label-hint">{hint}</span>
			{/if}
		</label>
	{/if}

	<div class="input-wrapper">
		{#if leadingActionIcon}
			<button
				class="leading-action-button"
				type="button"
				aria-label={leadingActionLabel}
				{disabled}
				onclick={onLeadingAction}
			>
				<Icon iconName={leadingActionIcon} iconSize="md" />
			</button>
		{:else if prefix}
			<span class="leading-prefix" aria-hidden="true">
				{prefix}
			</span>
		{:else if icon}
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
			{readonly}
			{maxlength}
			bind:value={getValue, setValue}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? `${inputId}-error` : undefined}
			class:error={Boolean(error)}
			class:dirty
			class:readonly
			class:has-leading-icon={Boolean(icon && !prefix)}
			class:has-leading-prefix={Boolean(prefix)}
			class:has-leading-action={Boolean(leadingActionIcon)}
			class:has-action-icon={Boolean(actionIcon)}
		/>

		{#if maxlength && type !== 'number' && type !== 'date' && type !== 'datetime-local'}
			<span class="char-counter" aria-hidden="true">
				{getValue().length}/{maxlength}
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

	.label-hint {
		margin-left: var(--spacing-sm);
		color: var(--gray);
		font-family: monospace;
	}

	.required-mark {
		margin-left: 2px;
		color: var(--status-red);
	}

	input {
		width: 100%;
		box-sizing: border-box;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font: var(--paragrafo);
		background-color: var(--white);
		color: var(--text-color-primary);
		outline: none;
		transition: var(--transition-default);
	}

	input.has-leading-icon,
	input.has-leading-prefix,
	input.has-leading-action {
		padding-left: 48px;
	}

	input.has-action-icon {
		padding-right: 48px;
	}

	input::placeholder {
		color: var(--gray);
	}

	.leading-icon,
	.leading-prefix {
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

	.leading-prefix {
		font: var(--paragrafo);
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

	.leading-action-button {
		position: absolute;
		left: var(--spacing-sm);
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

	.leading-action-button:hover {
		color: var(--primary-color);
	}

	.leading-action-button:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.leading-action-button:disabled {
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

	input.dirty {
		border-color: var(--status-green);
	}

	input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	input.readonly {
		cursor: default;
		background-color: var(--white-gray);
		color: var(--text-color-primary);
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
