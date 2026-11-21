<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName, IconSize } from '$lib/types/icons';

	export type IconBadgeVariant =
		'indigo' | 'green' | 'orange' | 'blue' | 'brand' | 'neutral' | 'danger' | 'override';
	export type IconBadgeSize = 'sm' | 'lg';

	interface BaseProps {
		iconName: IconName;
		size?: IconBadgeSize;
		ariaLabel?: string;
	}

	type Props =
		| (BaseProps & {
				variant: 'override';
				backgroundColor: string;
				iconColor: string;
				border?: string;
		  })
		| (BaseProps & {
				variant: Exclude<IconBadgeVariant, 'override'>;
				backgroundColor?: never;
				iconColor?: never;
				border?: never;
		  });

	let {
		iconName,
		variant,
		size = 'sm',
		backgroundColor,
		iconColor,
		border,
		ariaLabel
	}: Props = $props();

	const sizeIconMap: Record<IconBadgeSize, IconSize> = {
		sm: 'md',
		lg: 'xl'
	};
</script>

<span
	class="icon-badge {size} {variant}"
	style:background-color={variant === 'override' ? backgroundColor : undefined}
	style:color={variant === 'override' ? iconColor : undefined}
	style:border={variant === 'override' ? border : undefined}
>
	<Icon {iconName} iconSize={sizeIconMap[size]} {ariaLabel} />
</span>

<style>
	.icon-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.icon-badge.sm {
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.icon-badge.lg {
		width: 64px;
		height: 64px;
		border-radius: var(--radius-md);
	}

	/* Tons derivados dos tokens de status: o fundo é uma mistura suave sobre a
		superfície e o ícone mistura o acento com o texto, garantindo contraste
		nos dois temas (base clara e escura). */
	.icon-badge.indigo {
		background-color: var(--tint);
		color: var(--primary-color);
	}

	.icon-badge.green {
		background-color: color-mix(in srgb, var(--status-success) 16%, var(--surface));
		color: color-mix(in srgb, var(--status-success) 60%, var(--text-color-primary));
	}

	.icon-badge.orange {
		background-color: color-mix(in srgb, var(--status-warning) 16%, var(--surface));
		color: color-mix(in srgb, var(--status-warning) 72%, var(--text-color-primary));
	}

	.icon-badge.blue {
		background-color: color-mix(in srgb, var(--status-info) 16%, var(--surface));
		color: color-mix(in srgb, var(--status-info) 72%, var(--text-color-primary));
	}

	/* Tom da marca: deriva de `--primary-color` (acompanha a paleta do portal),
		aceitando override explícito por `--badge-bg`/`--badge-fg` (tokens de badge). */
	.icon-badge.brand {
		background-color: var(--badge-bg, color-mix(in srgb, var(--primary-color) 12%, var(--surface)));
		color: var(--badge-fg, color-mix(in srgb, var(--primary-color) 75%, var(--text-color-primary)));
	}

	.icon-badge.neutral {
		background-color: var(--white-gray);
		color: var(--text-color-secondary);
	}

	.icon-badge.danger {
		background-color: color-mix(in srgb, var(--status-error) 18%, var(--surface));
		color: color-mix(in srgb, var(--status-error) 72%, var(--text-color-primary));
	}
</style>
