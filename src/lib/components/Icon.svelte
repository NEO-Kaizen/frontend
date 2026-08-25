<script lang="ts">
	import { iconDictionary, type IconName, type IconSize } from '$lib/types/icons';

	// No futuro carregar apenas os icones que usamos

	interface Props {
		iconName: IconName;
		iconSize?: IconSize;
		ariaLabel?: string;
	}

	const { iconName, iconSize = 'md', ariaLabel }: Props = $props();
</script>

<span
	class="material-symbols-outlined {iconSize}"
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
