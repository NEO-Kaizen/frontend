<script lang="ts">
	interface Props {
		label: string;
		value?: string | number | null;
		fallback?: string;
		multiline?: boolean;
	}

	let { label, value, fallback = '---', multiline = false }: Props = $props();

	let display = $derived(
		value === null || value === undefined || String(value).trim() === '' ? fallback : String(value)
	);

	let isFallback = $derived(display === fallback);
</script>

<div class="field" class:multiline>
	<span class="field-label">{label}</span>
	<span class="field-value" class:is-fallback={isFallback}>{display}</span>
</div>

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
</style>
