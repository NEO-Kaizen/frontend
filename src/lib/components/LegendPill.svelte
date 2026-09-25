<script lang="ts">
	type Variant = 'identidade' | 'visibilidade' | 'ciclo' | 'encerramento' | 'tema' | 'neutral';

	let {
		label,
		tooltip,
		variant = 'neutral'
	}: {
		label: string;
		tooltip: string;
		variant?: Variant;
	} = $props();

	const uid = $props.id();
	const tipId = `legend-pill-${uid}`;
</script>

<button type="button" class="pill pill-{variant}" aria-describedby={tipId}>
	{label}
	<span id={tipId} role="tooltip" class="pill-tooltip">{tooltip}</span>
</button>

<style>
	.pill {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 2px 6px;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 11px;
		font-weight: 700;
		cursor: help;
		white-space: nowrap;
		text-decoration: underline dotted 1px;
		text-underline-offset: 2px;
		transition: filter var(--transition-default);
	}
	.pill:hover {
		filter: brightness(0.92);
	}
	.pill-identidade,
	.pill-visibilidade,
	.pill-ciclo,
	.pill-encerramento,
	.pill-tema,
	.pill-neutral {
		background: var(--surface);
		color: var(--text-color-secondary);
		border: 1px solid var(--border-color);
	}
	.pill-identidade {
		border-left: 3px solid var(--status-info);
	}
	.pill-visibilidade {
		border-left: 3px solid var(--status-warning);
	}
	.pill-ciclo {
		border-left: 3px solid var(--status-success);
	}
	.pill-encerramento {
		border-left: 3px solid var(--status-neutral);
	}
	.pill-tema {
		border-left: 3px solid var(--primary-color);
	}
	.pill-tooltip {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		z-index: 10;
		width: max-content;
		max-width: 280px;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background-color: var(--rich-black);
		color: var(--on-dark);
		font: var(--paragrafo);
		font-size: 13px;
		line-height: 1.4;
		font-weight: 400;
		text-decoration: none;
		white-space: normal;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-4px);
		transition: var(--transition-default);
	}
	.pill:hover .pill-tooltip,
	.pill:focus-visible .pill-tooltip,
	.pill:focus-within .pill-tooltip {
		opacity: 1;
		transform: translateY(0);
	}
</style>
