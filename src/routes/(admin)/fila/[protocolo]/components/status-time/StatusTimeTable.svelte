<script lang="ts">
	import type { StatusTotal } from '$lib/types/status-time';
	import { formatDuration } from '$lib/utils/durations';

	interface Props {
		totals: StatusTotal[];
	}

	let { totals }: Props = $props();
</script>

<div class="table-wrapper">
	<table>
		<caption>Tempo consolidado por Status</caption>
		<thead>
			<tr>
				<th scope="col">Status</th>
				<th scope="col">Tempo ativo</th>
				<th scope="col">Tempo pausado</th>
				<th scope="col">Classificação</th>
			</tr>
		</thead>
		<tbody>
			{#each totals as total (total.status)}
				<tr>
					<th scope="row">{total.status}</th>
					<td>{formatDuration(total.activeMilliseconds)}</td>
					<td>{formatDuration(total.pausedMilliseconds)}</td>
					<td>
						<span class={{ classification: true, paused: total.isPaused }}>
							{total.isPaused ? 'Pausa' : 'Ativo'}
						</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-inter);
		font-size: 13px;
	}

	caption {
		text-align: left;
		padding-bottom: var(--spacing-sm);
		font: var(--label);
		color: var(--secondary-color);
	}

	th,
	td {
		padding: 10px 12px;
		border-bottom: 1px solid var(--white-gray);
		text-align: left;
		vertical-align: top;
	}

	thead th {
		background: var(--background-color, #f9fafb);
		color: var(--secondary-color);
		white-space: nowrap;
	}

	tbody th {
		font-weight: 600;
		color: var(--black);
	}

	tbody td {
		color: var(--secondary-color);
	}

	tbody tr:last-child th,
	tbody tr:last-child td {
		border-bottom: none;
	}

	.classification {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--status-green-bg);
		color: var(--status-green);
		font-weight: 600;
	}

	.classification.paused {
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
	}
</style>
