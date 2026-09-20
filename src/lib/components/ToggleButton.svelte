<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		pressed: boolean;
		label: string;
		pressedLabel?: string;
		count?: number;
		iconName?: IconName;
		pressedIconName?: IconName;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		pressed,
		label,
		pressedLabel = label,
		count,
		iconName = 'visibility',
		pressedIconName = 'visibilityOff',
		disabled = false,
		onclick
	}: Props = $props();

	// O contador só aparece no estado não pressionado (ação "mostrar").
	const text = $derived(pressed ? pressedLabel : count ? `${label} (${count})` : label);
</script>

<button type="button" {disabled} {onclick} aria-pressed={pressed}>
	<Icon iconName={pressed ? pressedIconName : iconName} iconSize="sm" />
	<span>{text}</span>
</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);

		padding: var(--spacing-sm) var(--spacing-md);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		background-color: var(--white);
		color: var(--text-color-secondary);

		cursor: pointer;
		transition: var(--transition-default);
	}

	button[aria-pressed='true'] {
		border-color: var(--secondary-color);
		color: var(--secondary-color);
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
</style>
