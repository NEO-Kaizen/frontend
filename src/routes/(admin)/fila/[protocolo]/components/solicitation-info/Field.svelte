<script lang="ts">
	import FilterSelect from '$lib/components/FilterSelect.svelte';
	import Input from '$lib/components/Input.svelte';
	import Textarea from '$lib/components/Textarea.svelte';

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
		onEditInput?: (value: string) => void;
		onEditBlur?: () => void;
	}

	interface TextFieldProps extends FieldBase {
		kind?: 'text' | 'number' | 'date';
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
	let inputType: 'text' | 'number' | 'date' = $derived(
		variant.kind === 'number' ? 'number' : variant.kind === 'date' ? 'date' : 'text'
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
				maxlength={variant.maxlength}
				min={variant.min}
				step={variant.step}
				{error}
				dirty={isDirty}
			/>
		{/if}
	</div>
{:else}
	<div class="field" class:multiline={isMultiline}>
		<span class="field-label">{label}</span>
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
		background: #fafafa;
		border: 1px solid var(--white-gray);
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
	}

	.field-editor:focus-within {
		position: relative;
		z-index: 10;
		transform: scale(1.015);
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
