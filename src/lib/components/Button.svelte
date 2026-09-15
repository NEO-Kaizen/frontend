<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outline-neutral';
	type ButtonSize = 'default' | 'full'; //futuramente podemos adicionar nova variação de tamanho
	type ButtonType = 'button' | 'submit' | 'reset';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		loading?: boolean;
		disabled?: boolean;
		type?: ButtonType;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'default',
		loading = false,
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const isDisabled = $derived(disabled || loading);
</script>

<button
	{type}
	{onclick}
	class={className}
	disabled={isDisabled}
	aria-busy={loading}
	class:primary={variant === 'primary'}
	class:secondary={variant === 'secondary'}
	class:outline={variant === 'outline'}
	class:outline-neutral={variant === 'outline-neutral'}
	class:full={size === 'full'}
>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{/if}

	{@render children()}
</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);

		padding: var(--spacing-sm) var(--spacing-md);

		border-radius: 12px;
		border: 1px solid transparent;

		cursor: pointer;
		transition: var(--transition-default);
	}

	.primary {
		background-color: var(--primary-color);
		color: var(--on-primary);
		border: 1px solid var(--primary-color);
	}

	.secondary {
		background-color: var(--secondary-color);
		color: var(--on-primary);
	}

	.outline {
		background-color: var(--white);
		color: var(--primary-color);
		border: 1px solid var(--primary-color);
	}

	.outline-neutral {
		background-color: var(--white);
		color: var(--rich-black);
		border: var(--border-default);
	}

	.full {
		width: 100%;
		padding: var(--spacing-md);
		min-height: 48px;
	}

	button:hover:not(:disabled) {
		opacity: 0.9;
	}

	button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.spinner {
		width: 16px;
		height: 16px;

		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;

		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
