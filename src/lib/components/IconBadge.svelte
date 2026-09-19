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

	.icon-badge.indigo {
		background-color: rgba(182, 196, 255, 0.2);
		color: var(--primary-color);
	}

	.icon-badge.green {
		background-color: rgba(220, 252, 231, 1);
		color: #15803d;
	}

	.icon-badge.orange {
		background-color: rgba(255, 237, 213, 1);
		color: #c2410c;
	}

	.icon-badge.blue {
		background-color: rgba(219, 234, 254, 1);
		color: rgba(29, 78, 216, 1);
	}

	/* Tom da marca: deriva de `--primary-color` (acompanha a paleta do portal),
		aceitando override explícito por `--badge-bg`/`--badge-fg` (tokens de badge). */
	.icon-badge.brand {
		background-color: var(--badge-bg, color-mix(in srgb, var(--primary-color) 12%, var(--surface)));
		color: var(--badge-fg, color-mix(in srgb, var(--primary-color) 75%, var(--text-color-primary)));
	}

	.icon-badge.neutral {
		background-color: var(--white-gray);
		color: #4b5563;
	}

	.icon-badge.danger {
		background-color: #fee2e2;
		color: #b91c1c;
	}
</style>
