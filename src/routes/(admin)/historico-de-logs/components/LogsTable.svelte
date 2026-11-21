<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getActionLabel } from '$lib/audit/audit-labels';
	import type { AuditHistorySummary } from '$lib/types/audit';
	import { formatDateTime } from '$lib/utils/dates';

	interface Props {
		logs: AuditHistorySummary[];
		onselect: (auditId: number) => void;
	}

	let { logs, onselect }: Props = $props();

	function actorName(log: AuditHistorySummary): string {
		if (log.actor.kind === 'system') return 'Sistema';
		return log.actor.displayName ?? '—';
	}
</script>

<div class="table-wrapper">
	<table>
		<colgroup>
			<col class="col-id" />
			<col class="col-type" />
			<col class="col-action" />
			<col class="col-actor" />
			<col class="col-date" />
			<col class="col-detail" />
		</colgroup>

		<thead>
			<tr>
				<th>ID</th>
				<th>Tipo</th>
				<th>Ação</th>
				<th>Operador</th>
				<th>Data</th>
				<th class="detail-header">
					<span class="sr-only">Detalhes</span>
				</th>
			</tr>
		</thead>

		<tbody>
			{#each logs as log (log.audit_id)}
				<tr>
					<td class="id-cell">#{log.audit_id}</td>

					<td>
						<span class="type-badge">{log.entity_type_label}</span>
					</td>

					<td class="action-cell">{getActionLabel(log.action_type)}</td>

					<td class="actor-cell">{actorName(log)}</td>

					<td class="date-cell">{formatDateTime(log.occurred_at)}</td>

					<td class="detail-cell">
						<button
							type="button"
							class="detail-button"
							aria-label={`Ver detalhes do log #${log.audit_id}`}
							onclick={() => onselect(log.audit_id)}
						>
							<Icon iconName="visibility" iconSize="md" />
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		width: 100%;
		max-width: 100%;

		overflow-x: auto;

		background-color: var(--white);
	}

	table {
		width: 100%;

		min-width: 820px;

		table-layout: fixed;

		border-collapse: collapse;
	}

	.col-id {
		width: 8%;
	}

	.col-type {
		width: 20%;
	}

	.col-action {
		width: 28%;
	}

	.col-actor {
		width: 20%;
	}

	.col-date {
		width: 16%;
	}

	.col-detail {
		width: 8%;
	}

	th {
		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--background-color);

		border-bottom: var(--border-default);

		color: var(--gray);

		font: var(--label);

		font-size: 11px;

		text-align: left;

		text-transform: uppercase;
	}

	td {
		padding: var(--spacing-md);

		border-bottom: var(--border-default);

		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	tbody tr:hover {
		background-color: var(--background-color);
	}

	.id-cell {
		color: var(--gray);
		font: var(--label);
		font-size: 12px;
	}

	.type-badge {
		display: inline-flex;

		max-width: 100%;

		overflow: hidden;

		padding: 4px var(--spacing-sm);

		background-color: var(--tint);

		border-radius: 999px;

		color: var(--secondary-color);

		font: var(--label);

		font-size: 12px;

		white-space: nowrap;

		text-overflow: ellipsis;
	}

	.action-cell,
	.actor-cell {
		color: var(--black);
		font: var(--paragrafo);
		overflow: hidden;

		white-space: nowrap;

		text-overflow: ellipsis;
	}

	.date-cell {
		color: var(--gray);
		font: var(--paragrafo);
		font-size: 13px;
		white-space: nowrap;
	}

	.detail-header,
	.detail-cell {
		text-align: center;
	}

	.detail-button {
		width: 34px;
		height: 34px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		border: none;

		border-radius: var(--radius-sm);

		background: transparent;

		color: var(--gray);

		cursor: pointer;

		transition: var(--transition-default);
	}

	.detail-button:hover {
		background-color: var(--tint);

		color: var(--primary-color);
	}

	.detail-button:focus-visible {
		outline: 2px solid var(--secondary-color);

		outline-offset: 2px;
	}
</style>
