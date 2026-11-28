<script lang="ts">
	interface Props {
		count: number;
	}

	let { count }: Props = $props();

	const indexes = $derived(Array.from({ length: count }, (_, index) => index));
</script>

{#each indexes as index (index)}
	<li class="skeleton-card">
		<span class="skeleton-line skeleton-protocol neo-skeleton-pulse"></span>
		<span class="skeleton-line skeleton-title neo-skeleton-pulse"></span>
		<span class="skeleton-line skeleton-description neo-skeleton-pulse"></span>
		<span class="skeleton-line skeleton-date neo-skeleton-pulse"></span>
	</li>
{/each}

<style>
	.skeleton-card {
		display: flex;
		flex-direction: column;
		gap: var(--notification-skeleton-gap);
		padding: var(--spacing-sm) var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-md);
		min-height: var(--notification-skeleton-min-height);
	}

	.skeleton-line {
		display: block;
		height: var(--notification-skeleton-line-height);
		border-radius: var(--notification-skeleton-line-radius);
		background: var(--white-gray);
	}

	.skeleton-protocol {
		width: 34%;
	}

	.skeleton-title {
		width: 76%;
	}

	.skeleton-description {
		width: 91%;
	}

	.skeleton-date {
		width: 28%;
	}
</style>
