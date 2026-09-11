<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SettingsCard from './SettingsCard.svelte';

	type StatusTone = 'open' | 'analysis' | 'in-progress' | 'awaiting' | 'done' | 'cancelled';

	interface Status {
		name: string;
		visibility: 'Público' | 'Interno';
		closes: 'Sim' | 'Não';
		tone: StatusTone;
	}

	const statuses: Status[] = [
		{ name: 'Em aberto', visibility: 'Público', closes: 'Não', tone: 'open' },
		{ name: 'Em análise', visibility: 'Público', closes: 'Não', tone: 'analysis' },
		{ name: 'Em andamento', visibility: 'Público', closes: 'Não', tone: 'in-progress' },
		{ name: 'Aguardando cliente', visibility: 'Público', closes: 'Não', tone: 'awaiting' },
		{ name: 'Concluído', visibility: 'Público', closes: 'Sim', tone: 'done' },
		{ name: 'Cancelado', visibility: 'Interno', closes: 'Sim', tone: 'cancelled' }
	];
</script>

<SettingsCard
	iconName="pending"
	title="6. Status"
	description="Configure os status do ciclo de vida das solicitações."
>
	{#snippet headerAction()}
		<Button variant="secondary">
			<Icon iconName="addCircle" iconSize="sm" />
			<span class="status-add-label">
				<span>Adicionar</span>
				<span>status</span>
			</span>
		</Button>
	{/snippet}

	<div class="status-table">
		<table>
			<thead>
				<tr>
					<th scope="col" class="col-name">Nome</th>
					<th scope="col" class="col-visibility">Visível em</th>
					<th scope="col" class="col-closes">Encerramento</th>
					<th scope="col" class="col-tone">Tom visual</th>
					<th scope="col" class="col-actions">Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each statuses as status (status.name)}
					<tr class="tone-{status.tone}">
						<td class="col-name">
							<span class="status-dot" aria-hidden="true"></span>
							{status.name}
						</td>
						<td class="col-visibility">
							<span class="visibility-badge">{status.visibility}</span>
						</td>
						<td class="col-closes">{status.closes}</td>
						<td class="col-tone">
							<span class="tone-badge">
								<span class="tone-dot" aria-hidden="true"></span>
								{status.name}
							</span>
						</td>
						<td class="col-actions">
							<span class="action-icon" aria-hidden="true">
								<Icon iconName="edit" iconSize="sm" />
							</span>
							<span class="action-icon" aria-hidden="true">
								<Icon iconName="delete" iconSize="sm" />
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</SettingsCard>

<style>
	.status-table {
		width: 100%;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}

	th {
		padding: var(--spacing-sm) var(--spacing-sm);
		text-align: left;
		background: var(--background-color);
		color: var(--rich-black);
		font: var(--label);
		font-size: 12px;
		white-space: nowrap;
		border-bottom: var(--border-default);
	}

	td {
		padding: var(--spacing-sm) var(--spacing-sm);
		border-bottom: var(--border-default);
		color: var(--rich-black);
		font-size: 14px;
		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.col-name {
		width: 29%;
	}

	.col-visibility {
		width: 15%;
	}

	td.col-closes {
		width: 19%;
		color: var(--secondary-color);
		font-size: 13px;
		text-align: center;
	}

	.col-tone {
		width: 26%;
	}

	td.col-tone {
		text-align: center;
	}

	.col-actions {
		width: 11%;
		text-align: center;
		white-space: nowrap;
	}

	.status-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--tone-family);
		margin-right: var(--spacing-sm);
		vertical-align: middle;
	}

	.visibility-badge {
		display: inline-block;
		padding: 2px var(--spacing-sm);
		border-radius: var(--radius-sm);
		background-color: var(--white-gray);
		color: var(--rich-black);
		font-size: 12px;
		white-space: nowrap;
	}

	.tone-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 2px var(--spacing-sm);
		border: 1px solid var(--tone-border);
		border-radius: var(--radius-sm);
		background-color: var(--tone-bg);
		color: var(--tone-family);
		font-size: 12px;
		white-space: nowrap;
	}

	.tone-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--tone-family);
		flex-shrink: 0;
	}

	.action-icon {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
		color: var(--gray);
	}

	.action-icon + .action-icon {
		margin-left: var(--spacing-sm);
	}

	.tone-open {
		--tone-family: #0058be;
		--tone-bg: #0058be10;
		--tone-border: #0058be40;
	}

	.tone-analysis {
		--tone-family: #f97316;
		--tone-bg: #f9731610;
		--tone-border: #f9731640;
	}

	.tone-in-progress {
		--tone-family: #06b6d4;
		--tone-bg: #06b6d410;
		--tone-border: #06b6d440;
	}

	.tone-awaiting {
		--tone-family: #f59e0b;
		--tone-bg: #f59e0b10;
		--tone-border: #f59e0b40;
	}

	.tone-done {
		--tone-family: #10b981;
		--tone-bg: #10b98110;
		--tone-border: #10b98140;
	}

	.tone-cancelled {
		--tone-family: #e11d48;
		--tone-bg: #e11d4810;
		--tone-border: #e11d4840;
	}

	.status-add-label {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		line-height: 1.3;
	}

	:global(.settings-card-action button) {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		font-size: 13px;
		font-weight: 600;
		line-height: 1.3;
		white-space: normal;
	}
</style>
