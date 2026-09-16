<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		onAction?: (key: string) => void;
	}

	let { onAction }: Props = $props();

	let isOpen = $state(false);

	let containerEl: HTMLDivElement | undefined = $state(undefined);
	let fabEl: HTMLButtonElement | undefined = $state(undefined);

	type QuickAction = {
		key: string;
		label: string;
		hint: string;
		icon: 'send' | 'group' | 'calculate' | 'pending' | 'info';
	};

	const actions: QuickAction[] = [
		{
			key: 'requestChange',
			label: 'Solicitar Alteração',
			hint: 'Enviar solicitação ao solicitante',
			icon: 'send'
		},
		{
			key: 'assignResponsible',
			label: 'Atribuir Responsável',
			hint: 'Atribuir ou Alterar',
			icon: 'group'
		},
		{
			key: 'priorityCalculator',
			label: 'Calculadora de Prioridade',
			hint: 'Definir Prioridade ID',
			icon: 'calculate'
		},
		{ key: 'changeStatus', label: 'Alterar Status', hint: 'Registra alteração', icon: 'pending' },
		{
			key: 'informPending',
			label: 'Informar Pendência',
			hint: 'Comunicar com o solicitante',
			icon: 'info'
		}
	];

	const prefersReducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function toggle() {
		isOpen = !isOpen;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!isOpen) return;
		const target = event.target as Node;
		if (containerEl && !containerEl.contains(target)) {
			isOpen = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			isOpen = false;
			fabEl?.focus();
		}
	}

	function handleActionClick(key: string) {
		isOpen = false;
		onAction?.(key);
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<div class="quick-actions" bind:this={containerEl}>
	{#if isOpen}
		<div
			id="quick-actions-panel"
			class="panel"
			role="region"
			aria-label="Ações rápidas"
			transition:fly={{
				y: 16,
				duration: prefersReducedMotion ? 0 : 280,
				opacity: 0,
				easing: cubicOut
			}}
		>
			<p class="panel-title">Ações rápidas</p>
			<ul class="actions-list">
				{#each actions as action, index (action.key)}
					<li
						class="action-row"
						style:animation-delay={`${prefersReducedMotion ? '0ms' : `${index * 30}ms`}`}
					>
						<button type="button" class="action-item" onclick={() => handleActionClick(action.key)}>
							<span class="action-icon" aria-hidden="true">
								<Icon iconName={action.icon} iconSize="sm" />
							</span>
							<span class="action-text">
								<span class="action-label">{action.label}</span>
								<span class="action-hint">{action.hint}</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<button
		bind:this={fabEl}
		type="button"
		class="fab"
		class:open={isOpen}
		aria-expanded={isOpen}
		aria-controls="quick-actions-panel"
		aria-label={isOpen ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
		onclick={toggle}
	>
		<span class="fab-icon" class:open={isOpen} aria-hidden="true">
			<Icon iconName={isOpen ? 'close' : 'more'} iconSize="md" />
		</span>
	</button>
</div>

<style>
	.quick-actions {
		position: fixed;
		right: 34px;
		bottom: 34px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
		z-index: 40;
	}

	.panel {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		padding: 12px;
		width: 280px;
		transform-origin: bottom right;
	}

	.panel-title {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		color: var(--secondary-color);
		margin: 0 0 12px 0;
	}

	.actions-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.action-row {
		animation: rowIn 280ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	.action-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		padding: 8px;
		cursor: pointer;
		text-align: left;
		transition: background 150ms ease;
	}

	.action-item:hover {
		background: var(--background-color);
	}

	.action-item:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.action-icon {
		width: 32px;
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--status-blue-bg);
		color: var(--secondary-color);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.action-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.action-label {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--black);
		line-height: 1.3;
	}

	.action-hint {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 400;
		color: var(--gray);
		line-height: 1.3;
	}

	.fab {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: var(--secondary-color);
		color: var(--white);
		border: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(0, 88, 190, 0.35);
		transition:
			background 180ms ease,
			transform 180ms ease,
			box-shadow 180ms ease;
	}

	.fab:hover {
		background: var(--primary-color);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 35, 111, 0.35);
	}

	.fab:active {
		transform: scale(0.94);
	}

	.fab.open {
		background: var(--primary-color);
	}

	.fab:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.fab-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 280ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	.fab-icon.open {
		transform: rotate(90deg) scale(1.02);
	}

	@keyframes rowIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fab,
		.fab-icon,
		.action-row {
			transition: none;
			animation: none;
		}
	}

	@media (max-width: 640px) {
		.quick-actions {
			right: 16px;
			bottom: 16px;
		}

		.panel {
			width: min(280px, 90vw);
		}
	}
</style>
