<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from '$lib/components/Input.svelte';

	interface Props {
		value?: string;
		placeholder: string;
		ariaLabel: string;
		oninput?: HTMLInputAttributes['oninput'];
		actions?: Snippet;
		hasActions?: boolean;
	}

	let {
		value = $bindable(''),
		placeholder,
		ariaLabel,
		oninput,
		actions,
		hasActions = false
	}: Props = $props();
</script>

<div class="toolbar">
	<div class="search-box">
		<Input icon="search" type="search" {placeholder} aria-label={ariaLabel} bind:value {oninput} />
	</div>

	{#if hasActions}
		<div class="toolbar-actions">
			{@render actions?.()}
		</div>
	{/if}
</div>

<style>
	.toolbar {
		width: 100%;

		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: var(--spacing-md);

		padding: var(--spacing-sm);

		background-color: var(--background-color);

		flex-shrink: 0;
	}

	.search-box {
		flex: 1;

		width: 100%;
		max-width: none;
		min-width: 0;
	}

	.toolbar-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;

		gap: var(--spacing-sm);

		min-width: 220px;
	}

	@media (max-width: 800px) {
		.toolbar {
			flex-direction: column;

			align-items: stretch;
		}

		.toolbar-actions {
			width: 100%;
			min-width: 0;

			flex-direction: column;
			align-items: stretch;
		}

		.toolbar-actions :global(button) {
			width: 100%;
		}
	}
</style>
