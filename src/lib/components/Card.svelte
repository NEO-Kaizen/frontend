<script lang="ts">
	import Icon from './Icon.svelte';
	import Button from './Button.svelte';
	import type { IconName } from '$lib/types/icons';

	interface BaseProps {
		title: string;
		description: string;
		buttonText: string;
		iconName?: IconName;
		buttonIconName?: IconName;
	}

	type Props = BaseProps &
		(
			| { href: string; onAction?: never }
			| { onAction: (event: MouseEvent) => void; href?: never }
		);

	let {
		title,
		description,
		buttonText,
		iconName = 'addCircle',
		buttonIconName = 'arrowForward',
		href,
		onAction
	}: Props = $props();
</script>

<div class="card">
	<div class="card-content">
		<div class="icon-container">
			<Icon {iconName} iconSize="lg" />
		</div>

		<h3>{title}</h3>

		<pre class="description">{description}</pre>
	</div>

	{#if href}
		<a {href} class="card-link">
			{buttonText}
			<Icon iconName={buttonIconName} iconSize="sm" />
		</a>
	{:else}
		<Button variant="outline" onclick={onAction}>
			{buttonText}
			<Icon iconName={buttonIconName} iconSize="sm" />
		</Button>
	{/if}
</div>

<style>
	.card {
		background: linear-gradient(180deg, #002068 0%, #003399 100%);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
		max-width: 410.67px;
		height: 400px;
		box-shadow: var(--regular-shadow);
		box-sizing: border-box;
		transition: var(--transition-default);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-md);
		width: 100%;
	}

	.icon-container {
		width: 56px;
		height: 56px;
		border-radius: var(--radius-md);
		border: 1px solid rgba(255, 255, 255, 0.2);
		background-color: rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--spacing-sm);
		color: var(--white);
	}

	h3 {
		font: var(--h3);
		color: var(--white);
		margin: 0;
	}

	.description {
		font: var(--paragrafo);
		color: var(--white);
		opacity: 0.9;
		margin: 0;
		white-space: pre-wrap;
		font-family: inherit;
	}

	.card-link {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: 12px;
		background-color: var(--white);
		color: var(--primary-color, #002068);
		text-decoration: none;
		font: var(--button);
		transition: var(--transition-default);
	}

	.card-link:hover {
		opacity: 0.9;
	}
</style>
