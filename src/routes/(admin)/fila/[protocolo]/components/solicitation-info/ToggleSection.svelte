<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		id: string;
		open?: boolean;
		children: Snippet;
	}

	let { title, id, open = false, children }: Props = $props();

	// svelte-ignore state_referenced_locally
	let isOpen = $state(open);

	let contentId = $derived(`${id}-content`);
	let triggerId = $derived(`${id}-trigger`);

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="toggle-section" class:open={isOpen}>
	<button
		class="toggle-trigger"
		id={triggerId}
		aria-expanded={isOpen}
		aria-controls={contentId}
		type="button"
		onclick={toggle}
	>
		<span class="chevron" class:rotated={isOpen} aria-hidden="true">
			<Icon iconName="expandMore" iconSize="sm" />
		</span>
		<span class="toggle-title">{title}</span>
	</button>

	<div
		class="collapsible"
		class:open={isOpen}
		id={contentId}
		role="region"
		aria-labelledby={triggerId}
		inert={!isOpen}
	>
		<div class="inner">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.toggle-section {
		border-bottom: 1px solid var(--white-gray);
		padding-bottom: var(--spacing-sm);
	}

	.toggle-section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.toggle-trigger {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		background: none;
		border: none;
		padding: 12px 0;
		cursor: pointer;
		text-align: left;
		color: var(--black);
		font-family: var(--font-inter);
	}

	.toggle-trigger:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.toggle-title {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--black);
	}

	.chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 200ms ease;
		color: var(--secondary-color);
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.collapsible {
		display: grid;
		grid-template-rows: 0fr;
		opacity: 0;
		transition:
			grid-template-rows 250ms cubic-bezier(0.33, 1, 0.68, 1),
			opacity 200ms ease;
	}

	.collapsible.open {
		grid-template-rows: 1fr;
		opacity: 1;
	}

	.inner {
		overflow: hidden;
		min-height: 0;
		padding: 0px 20px;
	}

	@media (max-width: 640px) {
		.inner {
			padding-left: 24px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.collapsible {
			transition: none;
		}

		.chevron {
			transition: none;
		}
	}
</style>
