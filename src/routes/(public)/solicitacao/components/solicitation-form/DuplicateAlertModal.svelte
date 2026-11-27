<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { DuplicateAlertItem } from '$lib/types/duplicate';
	import DuplicateAlertItems from './DuplicateAlertItems.svelte';

	interface Props {
		items: DuplicateAlertItem[];
		onreview: () => void;
		oncontinue: () => void;
	}

	let { items, onreview, oncontinue }: Props = $props();
</script>

<Modal title="Possível duplicidade" onclose={onreview} size="lg">
	<div class="duplicate-dialog">
		<div class="dialog-intro">
			<span class="dialog-icon" aria-hidden="true">
				<Icon iconName="warning" iconSize="lg" />
			</span>
			<p>
				Encontramos solicitações com características muito parecidas com a sua. Revise os itens
				antes de continuar.
			</p>
		</div>

		<DuplicateAlertItems {items} />

		<div class="dialog-actions">
			<Button variant="outline" onclick={oncontinue}>Criar mesmo assim</Button>
			<Button variant="primary" onclick={onreview} data-autofocus>Revisar minha solicitação</Button>
		</div>
	</div>
</Modal>

<style>
	.duplicate-dialog {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.dialog-intro {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
	}

	.dialog-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--status-yellow);
	}

	.dialog-intro p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--black);
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-sm);
	}
</style>
