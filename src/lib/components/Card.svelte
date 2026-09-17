<script lang="ts">
	import { resolve } from '$app/paths';
	import type { IconName } from '$lib/types/icons';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import IconBadge from './IconBadge.svelte';

	export type CardVariant = 'primary' | 'secondary';
	export type BadgeVariant = 'brand' | 'neutral';
	export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outline-neutral';

	type StaticCardRoute = '/(public)/solicitacao' | '/(public)/login';

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

	// KNOWN ISSUE (svelte-check) — não estreitar este tipo sem entender a causa:
	// `resolve(href)` (abaixo, no markup) acusa erro porque o `RouteId` gerado
	// inclui ids de diretórios sem página (ex.: pastas `components/` da
	// colocação de componentes) e `resolve()` usa tipo condicional distributivo.
	// Falso-positivo: runtime e build passam; só o `check` fica vermelho.
	type Props = BaseProps &
		(
			| {
					href: StaticCardRoute;
					onAction?: never;
			  }
			| {
					onAction: (event: MouseEvent) => void;
					href?: never;
			  }
		);

	let {
		title,
		description,
		buttonText,
		iconName = 'addCircle',
		buttonIconName = 'arrowForward',
		variant = 'primary',
		badgeVariant = 'brand',
		buttonVariant,
		href,
		onAction
	}: Props = $props();

	let resolvedButtonVariant = $derived(
		buttonVariant ?? (variant === 'primary' ? 'outline' : 'primary')
	);
</script>

<div class="card {variant}">
	<div class="card-content">
		{#if variant === 'primary'}
			<IconBadge
				{iconName}
				variant="override"
				size="lg"
				backgroundColor="rgba(255, 255, 255, 0.1)"
				iconColor="#ffffff"
				border="1px solid rgba(255, 255, 255, 0.2)"
			/>
		{:else}
			<IconBadge {iconName} size="lg" variant={badgeVariant} />
		{/if}

		<h3>{title}</h3>

		<pre class="description">{description}</pre>
	</div>

	{#if href}
		<a href={resolve(href)} class="card-link {variant}">
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
		color: var(--on-primary);
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
		color: var(--on-primary);
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
		color: var(--on-primary);
	}

	.card-link:hover {
		opacity: 0.9;
	}
</style>
