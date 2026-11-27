<script lang="ts">
	import type { DuplicateAlertItem } from '$lib/types/duplicate';

	interface Props {
		items: DuplicateAlertItem[];
	}

	let { items }: Props = $props();
</script>

<ul class="duplicate-items" aria-label="Solicitações encontradas">
	{#each items as item (item.publicId)}
		<li class="duplicate-item">
			<h4>{item.title}</h4>
			{#if item.summary}
				<p>{item.summary}</p>
			{/if}

			<dl class="duplicate-meta">
				<div>
					<dt>Categoria</dt>
					<dd>{item.category}</dd>
				</div>
				<div>
					<dt>Status</dt>
					<dd>{item.status}</dd>
				</div>
				<div>
					<dt>Período</dt>
					<dd>{item.period}</dd>
				</div>
			</dl>
		</li>
	{/each}
</ul>

<style>
	.duplicate-items {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.duplicate-item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--background-color);
	}

	.duplicate-item h4 {
		margin: 0;
		font: var(--h4);
		color: var(--heading-color);
	}

	.duplicate-item p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--black);
	}

	.duplicate-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm) var(--spacing-md);
		margin: var(--spacing-xs) 0 0;
	}

	.duplicate-meta div {
		display: flex;
		gap: var(--spacing-xs);
		font: var(--label);
		font-size: 13px;
	}

	.duplicate-meta dt {
		color: var(--gray);
	}

	.duplicate-meta dt::after {
		content: ':';
	}

	.duplicate-meta dd {
		margin: 0;
		color: var(--black);
	}
</style>
