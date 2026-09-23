<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicIn, cubicInOut, cubicOut } from 'svelte/easing';
	import Icon from './Icon.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		onclose: () => void;
		size?: 'sm' | 'lg' | 'default' | 'large';
		children: Snippet;
	}

	let { title, onclose, children, size = 'sm' }: Props = $props();
	const resolvedSize = $derived(size === 'large' ? 'lg' : size === 'default' ? 'sm' : size);

	const uid = $props.id();

	let shellElement = $state<HTMLElement | null>(null);
	let previouslyFocused = $state<HTMLElement | null>(null);

	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose();
		}
	}

	onMount(() => {
		previouslyFocused = document.activeElement as HTMLElement;
		shellElement?.focus();
	});

	$effect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
			previouslyFocused?.focus();
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="modal-overlay"
	role="presentation"
	tabindex="-1"
	onclick={onclose}
	in:fade={{ duration: prefersReducedMotion ? 0 : 240, easing: cubicOut }}
	out:fade={{ duration: prefersReducedMotion ? 0 : 320, easing: cubicIn }}
>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		bind:this={shellElement}
		class="modal-shell"
		class:lg={resolvedSize === 'lg'}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		aria-labelledby={`modal-title-${uid}`}
		onclick={(event) => event.stopPropagation()}
		in:fly={{
			y: prefersReducedMotion ? 0 : 12,
			duration: prefersReducedMotion ? 0 : 280,
			easing: cubicOut,
			opacity: 0
		}}
		out:fly={{
			y: prefersReducedMotion ? 0 : 10,
			duration: prefersReducedMotion ? 0 : 340,
			easing: cubicInOut,
			opacity: 0
		}}
	>
		<header class="modal-header">
			<h3 id={`modal-title-${uid}`}>{title}</h3>
			<button type="button" class="modal-close" onclick={onclose} aria-label="Fechar">
				<Icon iconName="close" iconSize="md" />
			</button>
		</header>

		<div class="modal-body">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 70; /* > QuickActions 40 e FloatingPrioritizationPanel 60 — modal sempre acima */
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
		background-color: rgba(15, 26, 42, 0.55);
	}

	.modal-shell {
		width: 100%;
		max-width: 480px;
		max-height: calc(100dvh - var(--spacing-xl));
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: var(--white);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
	}

	.modal-shell.lg,
	.modal-shell--large {
		max-width: min(720px, 92vw);
		max-height: 80dvh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-shell.lg .modal-body,
	.modal-shell--large .modal-body {
		overflow: hidden;
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: var(--border-default);
		flex-shrink: 0;
	}

	.modal-header h3 {
		margin: 0;
		font: var(--h3);
		color: var(--heading-color);
	}

	.modal-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		border: none;
		background: none;
		color: var(--gray);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.modal-close:hover {
		color: var(--primary-color);
	}

	.modal-close:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.modal-body {
		padding: var(--spacing-lg);
		overflow-y: auto;
		min-height: 0;
	}
</style>
