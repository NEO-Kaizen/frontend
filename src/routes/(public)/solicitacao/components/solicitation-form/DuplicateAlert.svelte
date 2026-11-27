<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { DuplicateAlertItem } from '$lib/types/duplicate';
	import DuplicateAlertItems from './DuplicateAlertItems.svelte';

	interface Props {
		items: DuplicateAlertItem[];
	}

	let { items }: Props = $props();

	const titleId = $props.id();
</script>

<section class="duplicate-alert" aria-labelledby={titleId}>
	<div class="alert-header">
		<span class="alert-icon" aria-hidden="true">
			<Icon iconName="info" iconSize="md" />
		</span>
		<div class="alert-copy">
			<h4 id={titleId}>Características em comum</h4>
			<p>Encontramos solicitações parecidas com a sua. Isso não bloqueia o avanço do cadastro.</p>
		</div>
	</div>

	<DuplicateAlertItems {items} />
</section>

<style>
	.duplicate-alert {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-top: var(--spacing-lg);
		padding: var(--spacing-md);
		border: 1px solid var(--status-yellow);
		border-radius: var(--radius-sm);
		background-color: var(--status-yellow-bg);
	}

	.alert-header {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
	}

	.alert-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--status-yellow);
	}

	.alert-copy {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.alert-copy h4 {
		margin: 0;
		font: var(--h4);
		color: var(--heading-color);
	}

	.alert-copy p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--black);
	}
</style>
