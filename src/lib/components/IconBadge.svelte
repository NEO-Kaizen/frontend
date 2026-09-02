<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName, IconSize } from '$lib/types/icons';

	export type IconBadgeVariant = 'indigo' | 'green' | 'orange' | 'blue' | 'override';
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
</style>
