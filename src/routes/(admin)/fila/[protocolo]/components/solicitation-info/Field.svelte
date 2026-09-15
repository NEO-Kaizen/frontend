<script lang="ts">
	import EditInput from './EditInput.svelte';
	import EditSelect from './EditSelect.svelte';
	import EditTextarea from './EditTextarea.svelte';

	export type EditableFieldKind = 'text' | 'number' | 'date' | 'select' | 'textarea';

	interface Props {
		label: string;
		value?: string | number | null;
		fallback?: string;
		multiline?: boolean;
		isEditMode?: boolean;
		editable?: boolean;
		kind?: EditableFieldKind;
		editValue?: string;
		options?: { value: string; label: string }[];
		error?: string;
		dirty?: boolean;
		disabled?: boolean;
		allowEmpty?: boolean;
		maxlength?: number;
		min?: string;
		step?: string;
		rows?: number;
		onEditInput?: (value: string) => void;
		onEditBlur?: () => void;
	}

	let {
		label,
		value,
		fallback = '---',
		multiline = false,
		isEditMode = false,
		editable = true,
		kind = 'text',
		editValue = '',
		options = [],
		error = '',
		dirty = false,
		disabled = false,
		allowEmpty = false,
		maxlength,
		min,
		step,
		rows = 4,
		onEditInput,
		onEditBlur
	}: Props = $props();

	let display = $derived(
		value === null || value === undefined || String(value).trim() === '' ? fallback : String(value)
	);

	let isFallback = $derived(display === fallback);
	let editing = $derived(isEditMode && editable);
	let fieldVariant: 'editing' | 'dirty' | 'invalid' = $derived(
		error ? 'invalid' : dirty ? 'dirty' : 'editing'
	);
	let inputType: 'text' | 'number' | 'date' = $derived(
		kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'
	);

	function getEditValue(): string {
		return editValue;
	}

	function setEditValue(next: string): void {
		onEditInput?.(next);
	}
</script>

{#if editing}
	<div class="field-editor">
		{#if kind === 'textarea'}
			<EditTextarea
				{label}
				bind:value={getEditValue, setEditValue}
				{disabled}
				{maxlength}
				{rows}
				{error}
				{fieldVariant}
				onblur={onEditBlur}
			/>
		{:else if kind === 'select'}
			<EditSelect
				{label}
				value={editValue}
				{options}
				{disabled}
				{error}
				{fieldVariant}
				clearValue={allowEmpty ? '' : undefined}
				onchange={(next) => setEditValue(next)}
				onblur={onEditBlur}
			/>
		{:else}
			<EditInput
				{label}
				type={inputType}
				bind:value={getEditValue, setEditValue}
				{disabled}
				{maxlength}
				{min}
				{step}
				{error}
				{fieldVariant}
				onblur={onEditBlur}
			/>
		{/if}
	</div>
{:else}
	<div class="field" class:multiline>
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
