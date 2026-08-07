<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'outline';
	type ButtonSize = 'default' | 'large'; //futuramente podemos adicionar nova variação de tamanho
	type ButtonType = 'button' | 'submit' | 'reset';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		loading?: boolean;
		disabled?: boolean;
		type?: ButtonType;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'default',
		loading = false,
		disabled = false,
		type = 'button',
		onclick,
		children
	}: Props = $props();

	const isDisabled = $derived(disabled || loading);
</script>

<button
	{type}
	{onclick}
	disabled={isDisabled}
	aria-busy={loading}
	class:primary={variant === 'primary'}
	class:secondary={variant === 'secondary'}
	class:outline={variant === 'outline'}
	class:large={size === 'large'}
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

		padding: 8px 16px;

		border-radius: var(--radius-sm);
		border: 1px solid transparent;

		cursor: pointer;
		transition: var(--transition-default);
	}

	.primary {
		background-color: var(--primary-color);
		color: var(--white);
		border: 1px solid var(--primary-color);
	}

	.secondary {
		background-color: var(--secondary-color);
		color: var(--white);
	}

	.outline {
		background-color: var(--white);
		color: var(--primary-color);
		border: 1px solid var(--primary-color);
	}

	.large {
		width: 100%;
		padding: 12px 16px;
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
