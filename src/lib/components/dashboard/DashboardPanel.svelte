<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		children: Snippet;
	}

	let { title, description, children }: Props = $props();
	const headingId = $props.id();
</script>

<section class="panel" aria-labelledby={headingId}>
	<header>
		<h2 id={headingId}>{title}</h2>
		<p>{description}</p>
	</header>

	{@render children()}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		min-width: 0;
		padding: var(--spacing-lg);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
	}

	header {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	h2 {
		font: var(--h3);
		color: var(--rich-black);
	}

	p {
		font-size: 0.875rem;
		color: var(--gray);
	}
</style>
