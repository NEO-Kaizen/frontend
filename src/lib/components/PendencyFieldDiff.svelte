<script lang="ts">
	// Comparação "valor atual → valor corrigido" de um campo de pendência
	// (estilo diff: linha vermelha riscada + linha verde). Valores chegam já
	// formatados — cada visão mantém sua formatação (`displayValue` no
	// analista, `formatFieldValue` no solicitante).
	interface Props {
		oldValue: string;
		newValue: string;
		/** Rótulo do campo, usado no `aria-label` da comparação. */
		label?: string | null;
	}

	let { oldValue, newValue, label = null }: Props = $props();

	const ariaLabel = $derived(label ? `Comparação do campo ${label}` : 'Comparação do valor');
</script>

<div class="diff" aria-label={ariaLabel}>
	<div class="diff-line diff-old">
		<span class="diff-glyph" aria-hidden="true">−</span>
		<span class="diff-value">{oldValue}</span>
	</div>
	<div class="diff-line diff-new">
		<span class="diff-glyph" aria-hidden="true">＋</span>
		<span class="diff-value">{newValue}</span>
	</div>
</div>

<style>
	.diff {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.diff-line {
		display: flex;
		gap: var(--spacing-sm);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		align-items: baseline;
	}

	.diff-old {
		background: var(--status-red-bg);
	}

	.diff-new {
		background: var(--status-green-bg);
	}

	.diff-glyph {
		font-weight: 700;
		flex-shrink: 0;
	}

	.diff-old .diff-glyph {
		color: var(--status-red);
	}

	.diff-new .diff-glyph {
		color: var(--status-green);
	}

	.diff-value {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.diff-old .diff-value {
		text-decoration: line-through;
		color: var(--status-red);
	}

	.diff-new .diff-value {
		color: var(--status-green);
	}
</style>
