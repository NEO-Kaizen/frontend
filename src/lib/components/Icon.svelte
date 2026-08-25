<script lang="ts">
	import { iconDictionary, type IconName, type IconSize } from '$lib/types/icons';

	interface Props {
		iconName: IconName;
		iconSize?: IconSize;
		ariaLabel?: string;
	}

	let { iconName, iconSize = 'md', ariaLabel }: Props = $props();
</script>

<span
	class="material-symbols-outlined {iconSize}"
	role={ariaLabel ? 'img' : undefined}
	aria-hidden={ariaLabel ? undefined : true}
	aria-label={ariaLabel}
>
	{iconDictionary[iconName]}
</span>

<style>
	.sm {
		font-size: 16px;
	}
	.md {
		font-size: 20px;
	}
	.lg {
		font-size: 24px;
	}
	.xl {
		font-size: 32px;
	}
</style>
