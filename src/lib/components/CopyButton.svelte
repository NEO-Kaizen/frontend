<script lang="ts">
	import Icon from './Icon.svelte';
	import { copyToClipboard } from '$lib/utils/clipboard';

	interface Props {
		text: string;
		label?: string;
		feedbackDuration?: number;
	}

	let { text, label = 'Copiar senha', feedbackDuration = 2000 }: Props = $props();

	let copied = $state(false);
	let feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

	async function handleCopy() {
		const success = await copyToClipboard(text);

		if (!success) {
			return;
		}

		copied = true;
		clearTimeout(feedbackTimeout);
		feedbackTimeout = setTimeout(() => (copied = false), feedbackDuration);
	}
</script>

<button type="button" class="copy-button" onclick={handleCopy} title={label}>
	<Icon iconName="content_copy" iconSize="sm" />
	<span>{label}</span>
</button>

{#if copied}
	<span class="copy-feedback" role="status" aria-live="polite">Senha copiada!</span>
{/if}

<style>
	.copy-button {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs, 4px);
		padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--primary-color);
		cursor: pointer;
		font: var(--label);
		transition: var(--transition-default);
	}

	.copy-button:hover {
		background-color: var(--background-color);
	}

	.copy-button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.copy-feedback {
		font: var(--label);
		color: var(--status-green);
	}
</style>
