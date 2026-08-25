<script lang="ts">
	import IconBadge from './IconBadge.svelte';
	import Icon from './Icon.svelte';
	import Button from './Button.svelte';
	import type { IconName } from '$lib/types/icons';

	export type CardVariant = 'primary' | 'secondary';
	export type BadgeVariant = 'green' | 'cyan';
	export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outline-neutral';

	interface BaseProps {
		title: string;
		description: string;
		buttonText: string;
		iconName?: IconName;
		buttonIconName?: IconName;
		variant?: CardVariant;
		badgeVariant?: BadgeVariant;
		buttonVariant?: ButtonVariant;
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
		variant = 'primary',
		badgeVariant = 'cyan',
		buttonVariant,
		href,
		onAction
	}: Props = $props();

	let resolvedButtonVariant = $derived(
		buttonVariant ?? (variant === 'primary' ? 'outline' : 'primary')
	);

	const badgeStyles: Record<BadgeVariant, { backgroundColor: string; iconColor: string }> = {
		cyan: {
			backgroundColor: '#00F1FE33',
			iconColor: '#00696F'
		},
		green: {
			backgroundColor: '#6DFE9C33',
			iconColor: '#004721'
		}
	};
</script>

<div class="card {variant}">
	<div class="card-content">
		{#if variant === 'primary'}
			<IconBadge
				{iconName}
				size="lg"
				backgroundColor="rgba(255, 255, 255, 0.1)"
				iconColor="#ffffff"
				border="1px solid rgba(255, 255, 255, 0.2)"
			/>
		{:else}
			<IconBadge
				{iconName}
				size="lg"
				backgroundColor={badgeStyles[badgeVariant].backgroundColor}
				iconColor={badgeStyles[badgeVariant].iconColor}
			/>
		{/if}

		<h3>{title}</h3>

		<pre class="description">{description}</pre>
	</div>

	{#if href}
		<a {href} class="card-link {variant}">
			{buttonText}
			<Icon iconName={buttonIconName} iconSize="sm" />
		</a>
	{:else}
		<Button variant={resolvedButtonVariant} onclick={onAction}>
			{buttonText}
			<Icon iconName={buttonIconName} iconSize="sm" />
		</Button>
	{/if}
</div>

<style>
	.card {
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

	.card.primary {
		background: linear-gradient(180deg, #002068 0%, #003399 100%);
		color: var(--white);
	}

	.card.secondary {
		background-color: var(--white);
		border: 1px solid var(--border-color, #e0e0e0);
		color: var(--text-color, #1a1a1a);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-md);
		width: 100%;
	}

	h3 {
		font: var(--h3);
		margin: 0;
	}

	.primary h3,
	.primary .description {
		color: var(--white);
	}

	.secondary h3 {
		color: var(--text-color, #1a1a1a);
	}

	.secondary .description {
		color: var(--text-secondary, #666666);
	}

	.description {
		font: var(--paragrafo);
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
		border-radius: var(--radius-md);
		font: var(--button);
		transition: var(--transition-default);
		text-decoration: none;
	}

	.card-link.primary {
		background-color: var(--white);
		color: var(--primary-color, #002068);
	}

	.card-link.secondary {
		background-color: var(--primary-color, #002068);
		color: var(--white);
	}

	.card-link:hover {
		opacity: 0.9;
	}
</style>