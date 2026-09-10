<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		iconName?: IconName;
		children?: Snippet;
	}

	let { title, description = '', iconName, children }: Props = $props();
</script>

<article class="settings-card">
	<header class="settings-card-header">
		{#if iconName}
			<span class="icon-square" aria-hidden="true">
				<Icon {iconName} iconSize="sm" />
			</span>
		{/if}
		<div class="settings-card-text">
			<h2>{title}</h2>
			{#if description}
				<p>{description}</p>
			{/if}
		</div>
	</header>

	{#if children}
		{@render children()}
	{/if}
</article>

<style>
	.settings-card {
		width: 100%;
		box-sizing: border-box;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		box-shadow: var(--regular-shadow);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.settings-card-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.icon-square {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		background-color: var(--status-blue-bg);
		color: var(--secondary-color);
		flex-shrink: 0;
	}

	.settings-card-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	h2 {
		margin: 0;
		font: var(--h4);
		color: var(--primary-color);
	}

	p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--gray);
	}
</style>
