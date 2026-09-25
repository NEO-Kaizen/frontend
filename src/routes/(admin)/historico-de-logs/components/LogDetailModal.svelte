<script lang="ts">
	import { onMount } from 'svelte';

	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { getActionLabel } from '$lib/audit/audit-labels';
	import { getAuditHistoryDetail } from '$lib/services/audit-history.service';
	import type { AuditHistoryDetail } from '$lib/types/audit';
	import { formatDateTime } from '$lib/utils/dates';

	interface Props {
		auditId: number;
		onclose: () => void;
	}

	let { auditId, onclose }: Props = $props();

	let detail = $state<AuditHistoryDetail | null>(null);
	let isLoading = $state(true);
	let errorMessage = $state('');

	async function loadDetail() {
		isLoading = true;
		errorMessage = '';

		const result = await getAuditHistoryDetail(auditId);

		isLoading = false;

		if (!result.ok) {
			errorMessage = result.error.message;
			return;
		}

		detail = result.data;
	}

	onMount(loadDetail);

	// Valores são texto livre (podem conter JSON serializado) — formata quando
	// possível e mantém o texto cru caso contrário.
	function formatValue(value: string | null): string {
		if (value === null || value === '') return 'Não registrado';

		try {
			return JSON.stringify(JSON.parse(value), null, 2);
		} catch {
			return value;
		}
	}

	function originLabel(origin: string | null): string {
		switch (origin) {
			case 'admin':
				return 'Administrador';
			case 'system':
				return 'Sistema';
			case 'internal':
				return 'Interno';
			default:
				return '—';
		}
	}

	const actorLabel = $derived(
		detail ? (detail.actor.kind === 'system' ? 'Sistema' : (detail.actor.displayName ?? '—')) : '—'
	);
</script>

<Modal title={`Detalhes do log #${auditId}`} size="lg" {onclose}>
	{#if isLoading}
		<div class="state" role="status">
			<span class="spinner" aria-hidden="true"></span>
			<p>Carregando detalhes...</p>
		</div>
	{:else if errorMessage}
		<div class="state error" role="alert">
			<p>{errorMessage}</p>
			<Button variant="outline" onclick={loadDetail}>Tentar novamente</Button>
		</div>
	{:else if detail}
		<div class="detail">
			<dl class="meta">
				<div class="meta-item">
					<dt>Tipo</dt>
					<dd>{detail.entity_type}</dd>
				</div>

				<div class="meta-item">
					<dt>Ação</dt>
					<dd>{getActionLabel(detail.action_type)}</dd>
				</div>

				<div class="meta-item">
					<dt>Entidade</dt>
					<dd>{detail.entity_id}</dd>
				</div>

				<div class="meta-item">
					<dt>Operador</dt>
					<dd>{actorLabel}</dd>
				</div>

				<div class="meta-item">
					<dt>Data</dt>
					<dd>{formatDateTime(detail.occurred_at)}</dd>
				</div>

				<div class="meta-item">
					<dt>Origem</dt>
					<dd>{originLabel(detail.change_origin)}</dd>
				</div>
			</dl>

			<section class="values">
				<div class="value-block">
					<h4>Valor anterior</h4>
					<pre>{formatValue(detail.previous_value)}</pre>
				</div>

				<div class="value-block">
					<h4>Valor novo</h4>
					<pre>{formatValue(detail.new_value)}</pre>
				</div>
			</section>

			{#if detail.note}
				<section class="note">
					<h4>Observação</h4>
					<pre>{detail.note}</pre>
				</section>
			{/if}
		</div>
	{/if}
</Modal>

<style>
	.state {
		min-height: 180px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		text-align: center;
	}

	.state p {
		margin: 0;
		color: var(--gray);
	}

	.state.error p {
		color: var(--status-red);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--white-gray);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}

	.detail {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.meta {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
		margin: 0;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-item dt {
		color: var(--gray);
		font: var(--label);
		font-size: 11px;
		text-transform: uppercase;
	}

	.meta-item dd {
		margin: 0;
		color: var(--black);
		font: var(--paragrafo);
		word-break: break-word;
	}

	.values {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
	}

	h4 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--heading-color);
		font: var(--label);
	}

	pre {
		margin: 0;
		padding: var(--spacing-md);
		max-height: 240px;
		overflow: auto;
		background-color: var(--background-color);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--text-color-primary);
		font-family: monospace;
		font-size: 13px;
		white-space: pre-wrap;
		word-break: break-word;
	}

	@media (max-width: 600px) {
		.meta,
		.values {
			grid-template-columns: 1fr;
		}
	}
</style>
