<script lang="ts">
	import FilterSelect from '$lib/components/FilterSelect.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { IconName } from '$lib/types/icons';

	interface FieldBase {
		label: string;
		value?: string | number | null;
		fallback?: string;
		isEditMode?: boolean;
		editable?: boolean;
		editValue?: string;
		error?: string;
		dirty?: boolean;
		disabled?: boolean;
		required?: boolean;
		placeholder?: string;
		hint?: string;
		icon?: IconName;
		pending?: boolean;
		onPendencyClick?: () => void;
		onPendencyRemove?: () => void;
		onEditInput?: (value: string) => void;
		onEditBlur?: () => void;
	}

	interface TextFieldProps extends FieldBase {
		kind?: 'text' | 'number' | 'date' | 'datetime-local' | 'url';
		maxlength?: number;
		min?: string;
		step?: string;
	}

	interface SelectFieldProps extends FieldBase {
		kind: 'select';
		options?: { value: string; label: string }[];
		allowEmpty?: boolean;
	}

	interface TextareaFieldProps extends FieldBase {
		kind: 'textarea';
		multiline?: boolean;
		rows?: number;
		maxlength?: number;
	}

	type Props = TextFieldProps | SelectFieldProps | TextareaFieldProps;

	let {
		label,
		value,
		fallback = '---',
		isEditMode = false,
		editable = true,
		editValue = '',
		error = '',
		dirty = false,
		disabled = false,
		required = false,
		placeholder = '',
		hint = '',
		icon,
		pending = false,
		onPendencyClick,
		onPendencyRemove,
		onEditInput,
		onEditBlur,
		...variant
	}: Props = $props();

	let display = $derived(
		value === null || value === undefined || String(value).trim() === '' ? fallback : String(value)
	);

	let isFallback = $derived(display === fallback);
	let editing = $derived(isEditMode && editable);
	let isDirty = $derived(dirty && !error);
	let isMultiline = $derived(variant.kind === 'textarea' && variant.multiline === true);
	let inputType: 'text' | 'number' | 'date' | 'datetime-local' | 'url' = $derived(
		variant.kind === 'number'
			? 'number'
			: variant.kind === 'date'
				? 'date'
				: variant.kind === 'datetime-local'
					? 'datetime-local'
					: variant.kind === 'url'
						? 'url'
						: 'text'
	);

	function getEditValue(): string {
		return editValue;
	}

	function setEditValue(next: string): void {
		onEditInput?.(next);
	}

	function handleFocusOut(event: FocusEvent): void {
		const related = event.relatedTarget as Node | null;
		const editor = event.currentTarget as HTMLElement;

		if (related && editor.contains(related)) {
			return;
		}

		onEditBlur?.();
	}
</script>

{#if editing}
	<div class="field-editor" onfocusout={handleFocusOut}>
		{#if variant.kind === 'textarea'}
			<Textarea
				{label}
				bind:value={getEditValue, setEditValue}
				{disabled}
				{required}
				{placeholder}
				maxlength={variant.maxlength}
				rows={variant.rows ?? 4}
				{error}
				dirty={isDirty}
			/>
		{:else if variant.kind === 'select'}
			<FilterSelect
				{label}
				value={editValue}
				options={variant.options ?? []}
				{disabled}
				{required}
				{error}
				dirty={isDirty}
				clearValue={variant.allowEmpty ? '' : undefined}
				onchange={(next) => setEditValue(next)}
			/>
		{:else}
			<Input
				{label}
				type={inputType}
				bind:value={getEditValue, setEditValue}
				{disabled}
				{required}
				{placeholder}
				{icon}
				maxlength={variant.maxlength}
				min={variant.min}
				step={variant.step}
				{error}
				dirty={isDirty}
			/>
		{/if}
		{#if hint}
			<p class="field-hint">{hint}</p>
		{/if}
	</div>
{:else}
	<div class="field" class:multiline={isMultiline}>
		<div class="field-label-row">
			{#if onPendencyClick}
				<button
					type="button"
					class="field-label"
					class:marked={pending}
					onclick={onPendencyClick}
					aria-pressed={pending}
					title={pending
						? 'Editar justificativa desta marcação'
						: 'Marcar este campo para solicitar alteração'}
				>
					{label}{#if required}<span class="required-mark" aria-hidden="true">*</span>{/if}
				</button>
			{:else}
				<span class="field-label"
					>{label}{#if required}<span class="required-mark" aria-hidden="true">*</span>{/if}</span
				>
			{/if}
			{#if onPendencyClick}
				<button
					type="button"
					class="pending-btn"
					class:marked={pending}
					onclick={onPendencyClick}
					aria-pressed={pending}
					aria-label={pending
						? `Campo "${label}" marcado para alteração. Clique para editar a justificativa.`
						: `Solicitar alteração do campo "${label}".`}
					title={pending
						? 'Editar justificativa desta marcação'
						: 'Marcar este campo para solicitar alteração'}
				>
					<Icon iconName="flag" iconSize="sm" />
				</button>
				{#if pending && onPendencyRemove}
					<button
						type="button"
						class="pending-btn pending-remove"
						onclick={onPendencyRemove}
						aria-label={`Remover a marcação do campo "${label}".`}
						title="Remover marcação"
					>
						<Icon iconName="close" iconSize="sm" />
					</button>
				{/if}
			{/if}
		</div>
		<span class="field-value" class:is-fallback={isFallback}>{display}</span>
	</div>
{/if}

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field-label {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray);
		letter-spacing: 0.03em;
		line-height: 1.5;
	}

	.required-mark {
		margin-left: 2px;
		color: var(--status-red);
	}

	button.field-label {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
	}

	button.field-label:hover {
		text-decoration: underline;
	}

	button.field-label:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.field-label-row {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	.field-label.marked {
		color: var(--secondary-color);
	}

	.pending-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		background: var(--white);
		color: var(--gray);
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background 150ms ease,
			color 150ms ease,
			border-color 150ms ease;
	}

	.pending-btn:hover {
		border-color: var(--secondary-color);
		color: var(--secondary-color);
		background: var(--status-blue-bg);
	}

	.pending-btn:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.pending-btn.marked {
		border-color: var(--secondary-color);
		color: var(--secondary-color);
		background: var(--white);
	}

	.pending-btn.marked:hover {
		background: var(--status-blue-bg);
		color: var(--primary-color);
		border-color: var(--primary-color);
	}

	.pending-remove {
		color: var(--status-red);
	}

	.pending-remove:hover {
		border-color: var(--status-red);
		color: var(--status-red);
		background: var(--status-red-bg);
	}

	.field-value {
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 400;
		color: var(--black);
		line-height: 1.5;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.field-value.is-fallback {
		color: var(--gray);
	}

	.field.multiline .field-value {
		white-space: pre-wrap;
		word-break: break-word;
		overflow-wrap: anywhere;
		background: var(--surface);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm) 12px;
	}

	.field-editor {
		position: relative;
		min-width: 0;
		max-width: 100%;
		border-radius: var(--radius-sm);
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
		margin-bottom: var(--spacing-md);
	}

	.field-editor:focus-within {
		position: relative;
		z-index: 10;
		transform: scale(1.015);
	}

	.field-hint {
		margin: 4px 0 0 0;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	@media (prefers-reduced-motion: reduce) {
		.field-editor {
			transition: none;
		}

		.field-editor:focus-within {
			transform: none;
			box-shadow: none;
		}
	}
</style>
