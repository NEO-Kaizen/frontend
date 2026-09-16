<script lang="ts">
	import { tick } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { cubicOut, cubicInOut } from 'svelte/easing';
	import Icon from '$lib/components/Icon.svelte';
	import type { CriterionNotes, PrioritizationResult } from '$lib/types/prioritization';
	import PrioritizationCalculator from '../PrioritizationCalculator.svelte';

	interface Props {
		protocol: string;
		initialNotes?: CriterionNotes;
		isOpen: boolean;
		isMinimized: boolean;
		position?: { x: number; y: number } | null;
		onClose: () => void;
		onMinimize: () => void;
		onPositionChange?: (pos: { x: number; y: number }) => void;
		onSave?: (result: PrioritizationResult, notes: CriterionNotes) => void;
	}

	let {
		protocol,
		initialNotes = {},
		isOpen,
		isMinimized,
		position = null,
		onClose,
		onMinimize,
		onPositionChange,
		onSave
	}: Props = $props();

	let panelEl = $state<HTMLElement | null>(null);
	let headerEl = $state<HTMLElement | null>(null);
	// svelte-ignore state_referenced_locally
	let pos = $state<{ x: number; y: number }>(position ? { ...position } : { x: 0, y: 0 });
	let dragging = $state(false);
	let start = $state({ x: 0, y: 0, origX: 0, origY: 0 });

	$effect(() => {
		if (position) {
			pos = { x: position.x, y: position.y };
		}
	});

	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const flyIn = prefersReducedMotion
		? { y: 0, duration: 0 }
		: { y: 20, duration: 320, easing: cubicOut };
	const flyOut = prefersReducedMotion
		? { y: 0, duration: 0 }
		: { y: 20, duration: 240, easing: cubicInOut };
	const slideMinimize = prefersReducedMotion
		? { duration: 0 }
		: { duration: 260, easing: cubicOut };

	// Quando protocolo muda, não resetamos posição automaticamente — mantém
	// última posição arrastada. Se produto exigir reset por protocolo, reativa aqui.
	// $effect(() => { void protocol; pos = { x: 0, y: 0 }; });

	function handleHeaderPointerDown(event: PointerEvent) {
		const target = event.target as HTMLElement;
		if (target.closest('button')) return;
		if (!panelEl) return;
		// Desabilita arrasto em telas pequenas (<640px) — painel fica ancorado na base
		if (typeof window !== 'undefined' && window.innerWidth < 640) return;

		dragging = true;
		start = { x: event.clientX, y: event.clientY, origX: pos.x, origY: pos.y };
		try {
			(headerEl ?? (event.currentTarget as HTMLElement))?.setPointerCapture(event.pointerId);
		} catch {
			// ignore if capture fails
		}
		document.body.style.userSelect = 'none';
		(document.body.style as unknown as Record<string, string>).webkitUserSelect = 'none';
	}

	function clampPosition(nx: number, ny: number): { x: number; y: number } {
		if (!panelEl) return { x: nx, y: ny };
		const rect = panelEl.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const margin = 8;

		// rect inclui transform atual (pos.x / pos.y). Derivar posição base (sem transform).
		const baseLeft = rect.left - pos.x;
		const baseTop = rect.top - pos.y;
		const width = rect.width;
		const height = rect.height;

		const futureLeft = baseLeft + nx;
		const futureTop = baseTop + ny;

		const minLeft = margin;
		const maxLeft = vw - width - margin;
		const minTop = margin;
		const maxTop = vh - height - margin;

		// Se painel maior que viewport, permite pelo menos margin
		const clampedLeft = Math.min(Math.max(futureLeft, minLeft), Math.max(maxLeft, minLeft));
		const clampedTop = Math.min(Math.max(futureTop, minTop), Math.max(maxTop, minTop));

		return {
			x: clampedLeft - baseLeft,
			y: clampedTop - baseTop
		};
	}

	function handlePointerMove(event: PointerEvent) {
		if (!dragging) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		const nx = start.origX + dx;
		const ny = start.origY + dy;
		const clamped = clampPosition(nx, ny);
		pos = clamped;
	}

	function handlePointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		document.body.style.userSelect = '';
		(document.body.style as unknown as Record<string, string>).webkitUserSelect = '';
		try {
			(headerEl ?? (event.currentTarget as HTMLElement))?.releasePointerCapture(event.pointerId);
		} catch {
			// ignore
		}
		onPositionChange?.({ ...pos });
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;
		// Esc fecha o painel quando foco está dentro dele (não interfere no FAB quando fechado)
		if (event.key === 'Escape') {
			const active = document.activeElement as HTMLElement | null;
			if (panelEl && active && panelEl.contains(active)) {
				event.stopPropagation();
				onClose();
			}
		}
	}

	function handleWindowResize() {
		if (!isOpen || !panelEl) return;
		// Re-clamp posição existente se viewport encolheu
		const clamped = clampPosition(pos.x, pos.y);
		if (clamped.x !== pos.x || clamped.y !== pos.y) {
			pos = clamped;
			onPositionChange?.({ ...pos });
		}
	}

	// Foco ao abrir: foca no botão minimizar para acessibilidade (evita perder foco no trigger)
	$effect(() => {
		if (isOpen && !isMinimized) {
			tick().then(() => {
				// Se painel acabou de abrir, tenta focar no header minimize
				const btn = panelEl?.querySelector<HTMLElement>('[data-panel-autofocus]');
				btn?.focus();
			});
		}
	});

	// Quando minimizado, não precisa clamp extra; quando restaurado, re-clamp
	$effect(() => {
		// Reagir a isMinimized para re-clamp após altura mudar
		void isMinimized;
		if (isOpen) {
			tick().then(handleWindowResize);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} onresize={handleWindowResize} />

{#if isOpen}
	<div
		bind:this={panelEl}
		class="floating-panel"
		class:minimized={isMinimized}
		class:dragging
		role="dialog"
		aria-modal="false"
		aria-labelledby="floating-prioritization-title"
		style:transform={`translate(${pos.x}px, ${pos.y}px)`}
		in:fly={flyIn}
		out:fly={flyOut}
	>
		<div
			bind:this={headerEl}
			class="panel-header"
			class:dragging
			role="group"
			aria-label="Barra da calculadora de priorização - arraste para mover"
			onpointerdown={handleHeaderPointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
		>
			<div class="panel-title">
				<span class="drag-handle" aria-hidden="true">⋮⋮</span>
				<Icon iconName="calculate" iconSize="sm" />
				<h2 id="floating-prioritization-title" class="title-text">Cálculo de Priorização</h2>
			</div>
			<div class="panel-header-actions">
				<button
					type="button"
					class="header-btn minimize-btn"
					onclick={onMinimize}
					aria-label={isMinimized ? 'Restaurar calculadora' : 'Minimizar calculadora'}
					aria-expanded={!isMinimized}
					title={isMinimized ? 'Restaurar' : 'Minimizar'}
					data-panel-autofocus
				>
					<Icon iconName={isMinimized ? 'expandMore' : 'expandLess'} iconSize="md" />
				</button>
				<button
					type="button"
					class="header-btn close-btn"
					onclick={onClose}
					aria-label="Fechar calculadora de priorização"
					title="Fechar"
				>
					<Icon iconName="close" iconSize="md" />
				</button>
			</div>
		</div>

		{#if !isMinimized}
			<div class="panel-content" transition:slide={slideMinimize}>
				{#key protocol}
					<PrioritizationCalculator {protocol} {initialNotes} floating={true} onsave={onSave} />
				{/key}
			</div>
		{/if}
	</div>
{/if}

<style>
	.floating-panel {
		position: fixed;
		/* Default sem drag: canto inferior direito acima do FAB */
		right: 32px;
		bottom: 96px;
		z-index: 60; /* > QuickActions 40, < Modal 70 */
		width: 460px;
		max-width: min(460px, 92vw);
		max-height: 50dvh;
		max-height: 50vh; /* fallback para browsers sem dvh */
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* Isola stacking context para evitar vazamento de z-index interno */
		isolation: isolate;
		/* Transição suave para minimizar/restaurar (height/max-height) */
		transition:
			max-height 300ms cubic-bezier(0.32, 0.72, 0, 1),
			height 300ms cubic-bezier(0.32, 0.72, 0, 1);
	}

	.floating-panel.minimized {
		/* Header-only: 48px + borda — transição suave via max-height acima */
		max-height: 48px;
		height: 48px;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		padding: 8px 10px 8px 12px;
		border-bottom: 1px solid rgb(220, 220, 220);
		background: var(--white);
		cursor: grab;
		touch-action: none;
		user-select: none;
		flex-shrink: 0;
		min-height: 48px;
		box-sizing: border-box;
	}

	.panel-header.dragging {
		cursor: grabbing;
	}

	.panel-title {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 0;
	}

	.drag-handle {
		color: var(--gray);
		font-size: 12px;
		letter-spacing: 1px;
		line-height: 1;
		user-select: none;
	}

	.title-text {
		margin: 0;
		color: var(--primary-color);
		font-family: var(--font-montserrat);
		font-size: 15px;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.panel-header-actions {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}

	.header-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		border: none;
		background: none;
		color: var(--gray);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition-default);
		flex-shrink: 0;
	}

	.header-btn:hover {
		color: var(--primary-color);
		background: var(--background-color);
	}

	.header-btn:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.header-btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.panel-content {
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
		flex: 1 1 auto;
		min-height: 0;
		/* Scroll interno respeita max-height do container */
	}

	@media (max-width: 640px) {
		.floating-panel {
			right: 16px;
			left: 16px;
			bottom: 16px;
			width: auto;
			max-width: none;
			/* Em mobile o drag fica restrito; posição fixa na base */
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.floating-panel {
			transition: none;
		}
	}
</style>
