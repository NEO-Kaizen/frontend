<script lang="ts">
	// Tooltip informativo reutilizável: um botão "i" que revela o texto no hover/focus.
	// O texto fica ligado ao gatilho via `aria-describedby` (lido por leitores de tela).
	interface Props {
		// Nome acessível do gatilho (o que a informação explica).
		label: string;
		// Conteúdo do tooltip.
		text: string;
	}

	let { label, text }: Props = $props();

	const uid = $props.id();
	const tipId = `info-tip-${uid}`;
</script>

<span class="info-tip-container">
	<button class="info-tip" type="button" aria-label={label} aria-describedby={tipId}>
		<span aria-hidden="true">i</span>
	</button>
	<span class="info-tip-tooltip" id={tipId} role="tooltip">{text}</span>
</span>

<style>
	.info-tip-container {
		position: relative;
		display: inline-flex;
		vertical-align: middle;
		flex-shrink: 0;
	}

	.info-tip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background-color: var(--secondary-color);
		color: var(--on-primary);
		font: var(--label);
		font-size: 12px;
		line-height: 1;
		cursor: help;
		transition: var(--transition-default);
	}

	.info-tip:hover {
		opacity: 0.9;
	}

	.info-tip-tooltip {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		z-index: 10;
		width: max-content;
		max-width: 280px;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background-color: var(--rich-black);
		color: var(--on-primary);
		font: var(--paragrafo);
		font-size: 13px;
		line-height: 1.4;
		text-transform: none;
		letter-spacing: normal;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-4px);
		transition: var(--transition-default);
	}

	.info-tip-container:hover .info-tip-tooltip,
	.info-tip-container:focus-within .info-tip-tooltip {
		opacity: 1;
		transform: translateY(0);
	}
</style>
