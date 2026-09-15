<script lang="ts">
	interface Props {
		label?: string;
		placeholder?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		dirty?: boolean;
		name?: string;
		id?: string;
		rows?: number;
		maxlength?: number;
		oninput?: () => void;
	}

	let {
		label = '',
		placeholder = '',
		value = $bindable(''),
		required = false,
		disabled = false,
		error = '',
		dirty = false,
		name,
		id,
		rows = 4,
		maxlength,
		oninput
	}: Props = $props();

	const uid = $props.id();
	const textareaId = $derived(id ?? uid);
</script>

<div class="textarea-field">
	{#if label}
		<label for={textareaId}>{label}</label>
	{/if}

	<div class="textarea-wrapper">
		<textarea
			id={textareaId}
			{name}
			{placeholder}
			{required}
			{disabled}
			{rows}
			{maxlength}
			bind:value
			{oninput}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? `${textareaId}-error` : undefined}
			class:error={Boolean(error)}
			class:dirty></textarea>

		{#if maxlength}
			<span class="char-counter" aria-hidden="true">
				{value.length}/{maxlength}
			</span>
		{/if}
	</div>

	{#if error}
		<p id={`${textareaId}-error`} class="error-message">
			{error}
		</p>
	{/if}
</div>

<style>
	.textarea-field {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

	label {
		font: var(--label);
		color: var(--black);
	}

	textarea {
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
		resize: vertical;
		min-height: 100px;
	}

	textarea::placeholder {
		color: var(--gray);
	}

	textarea:focus {
		border-color: var(--primary-color);
	}

	textarea:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	textarea.error {
		border-color: var(--status-red);
	}

	textarea.dirty {
		border-color: var(--secondary-color);
	}

	textarea:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.textarea-wrapper {
		position: relative;
	}

	.char-counter {
		position: absolute;
		right: var(--spacing-sm);
		bottom: 8px;
		font-size: 12px;
		line-height: 1;
		color: var(--gray);
		pointer-events: none;
		background-color: var(--white);
		padding: 0 2px;
	}

	.error-message {
		margin: 0;
		margin-top: 4px;
		color: var(--status-red);
		font: var(--label);
	}
</style>
