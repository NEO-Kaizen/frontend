<script lang="ts">
	// Tooltip informativo reutilizável: um botão "i" que revela o texto no hover/focus.
	// O texto fica ligado ao gatilho via `aria-describedby` (lido por leitores de tela).
	interface Props {
		// Nome acessível do gatilho (o que a informação explica).
		label: string;
		// Conteúdo do tooltip.
		text: string;
		// Lado do gatilho onde o tooltip será exibido.
		side?: 'top' | 'bottom';
		// Alinhamento horizontal do tooltip em relação ao gatilho.
		align?: 'start' | 'end';
	}

	let { label, text, side = 'bottom', align = 'start' }: Props = $props();

	const uid = $props.id();
	const tipId = `info-tip-${uid}`;

	const TOOLTIP_GAP = 8;
	const VIEWPORT_MARGIN = 8;

	let trigger: HTMLButtonElement | undefined;
	let tooltip: HTMLSpanElement | undefined;
	let position = $state({ top: 0, left: 0 });

	function captureTrigger(node: HTMLButtonElement) {
		trigger = node;
		return () => {
			trigger = undefined;
		};
	}

	function captureTooltip(node: HTMLSpanElement) {
		tooltip = node;
		return () => {
			tooltip = undefined;
		};
	}

	// `position: fixed` evita que o tooltip seja recortado por contêineres com
	// `overflow` (como a tabela rolável) sem precisar mover nós do DOM.
	function placeTooltip() {
		if (!trigger || !tooltip) return;

		const anchor = trigger.getBoundingClientRect();
		const width = tooltip.offsetWidth;
		const height = tooltip.offsetHeight;
		const top = side === 'top' ? anchor.top - height - TOOLTIP_GAP : anchor.bottom + TOOLTIP_GAP;
		const left = align === 'end' ? anchor.right - width : anchor.left;

		position = {
			top: Math.min(
				Math.max(top, VIEWPORT_MARGIN),
				Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN)
			),
			left: Math.min(
				Math.max(left, VIEWPORT_MARGIN),
				Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN)
			)
		};
	}
</script>

<svelte:window onscrollcapture={placeTooltip} onresize={placeTooltip} />

<span class="info-tip-container">
	<button
		class="info-tip"
		type="button"
		aria-label={label}
		aria-describedby={tipId}
		{@attach captureTrigger}
		onpointerenter={placeTooltip}
		onfocus={placeTooltip}
	>
		<span aria-hidden="true">i</span>
	</button>
	<span
		class="info-tip-tooltip"
		id={tipId}
		role="tooltip"
		{@attach captureTooltip}
		style:top={`${position.top}px`}
		style:left={`${position.left}px`}
	>
		{text}
	</span>
</span>

<style>
	.info-tip-container {
		display: inline-flex;
		vertical-align: middle;
		flex-shrink: 0;
	}

	.info-tip {
		position: relative;
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

	/* Mantém o círculo visual de 14px, mas amplia a área clicável para 44x44px. */
	.info-tip::before {
		content: '';
		position: absolute;
		inset: -15px;
	}

	.info-tip:hover {
		opacity: 0.9;
	}

	.info-tip-tooltip {
		position: fixed;
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
		text-transform: none;
		letter-spacing: normal;
		white-space: normal;
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

	@media (prefers-reduced-motion: reduce) {
		.info-tip-tooltip,
		.info-tip-container:hover .info-tip-tooltip,
		.info-tip-container:focus-within .info-tip-tooltip {
			transition: none;
			transform: none;
		}
	}
</style>
