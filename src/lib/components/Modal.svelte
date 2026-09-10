<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		onclose: () => void;
		children: Snippet;
	}

	let { title, onclose, children }: Props = $props();

	const uid = $props.id();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose();
		}
	}

	$effect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="modal-overlay"
	role="presentation"
	tabindex="-1"
	onclick={onclose}
	onkeydown={handleKeydown}
>
	<div
		class="modal-shell"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		aria-labelledby={`modal-title-${uid}`}
		onclick={(event) => event.stopPropagation()}
		onkeydown={handleKeydown}
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
		z-index: 50;
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
		overflow-y: auto;
		background-color: var(--white);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: var(--border-default);
	}

	.modal-header h3 {
		margin: 0;
		font: var(--h3);
		color: var(--primary-color);
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
	}
</style>
