<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName, IconSize } from '$lib/types/icons';

	export type IconBadgeVariant = 'indigo' | 'green' | 'orange' | 'blue';
	export type IconBadgeSize = 'sm' | 'lg';

	interface Props {
		iconName: IconName;
		variant?: IconBadgeVariant;
		size?: IconBadgeSize;
		backgroundColor?: string;
		iconColor?: string;
		border?: string;
		ariaLabel?: string;
	}

	let {
		iconName,
		variant = 'indigo',
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
	style:background-color={backgroundColor}
	style:color={iconColor}
	style:border
	aria-hidden={ariaLabel ? undefined : true}
	aria-label={ariaLabel}
>
	<Icon {iconName} iconSize={sizeIconMap[size]} />
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
		color: #15803D;
	}

	.icon-badge.orange {
		background-color: rgba(255, 237, 213, 1);
		color: #C2410C;
	}

	.icon-badge.blue {
		background-color: rgba(219, 234, 254, 1);
		color: rgba(29, 78, 216, 1);
	}
</style>
