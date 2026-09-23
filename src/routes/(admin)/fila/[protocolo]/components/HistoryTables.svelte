<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import {
		MAPPING_DURATION_OPTIONS,
		MODALITY_LABELS,
		type MappingResponse
	} from '$lib/types/mapping';
	import type { MappingHistoryEntry, TriageHistoryEntry } from '$lib/types/internal-note';
	import { formatDateTime } from '$lib/utils/dates';

	// Tabelas dos históricos completos (D-N14) — `oldest → newest`, não
	// paginadas, idênticas em toda página. Componente controlado: o estado de
	// disclosure/detail vive na InternalNotesSection (sem $effect).
	interface Props {
		triages: TriageHistoryEntry[];
		mappings: MappingHistoryEntry[];
		triagesOpen: boolean;
		mappingsOpen: boolean;
		openTriageId: string | null;
		openMappingId: string | null;
		onToggleTriages: () => void;
		onToggleMappings: () => void;
		onToggleTriageRow: (id: string) => void;
		onToggleMappingRow: (id: string) => void;
	}

	let {
		triages,
		mappings,
		triagesOpen,
		mappingsOpen,
		openTriageId,
		openMappingId,
		onToggleTriages,
		onToggleMappings,
		onToggleTriageRow,
		onToggleMappingRow
	}: Props = $props();

	// exitStatus é PortalStatus.id — resolvido contra a config do portal;
	// `''` (formulário vazio) exibe `---`.
	function exitStatusLabel(exitStatus: number | ''): string {
		if (exitStatus === '') return '---';
		return (
			page.data.portalConfig.statuses.find((status) => status.id === exitStatus)?.name ??
			String(exitStatus)
		);
	}

	function durationLabel(durationMinutes: number | null): string {
		if (durationMinutes === null) return '---';
		return (
			MAPPING_DURATION_OPTIONS.find((option) => option.value === String(durationMinutes))?.label ??
			`${durationMinutes} minutos`
		);
	}

	function modalityLabel(modality: MappingResponse['modality']): string {
		return modality === null ? '---' : (MODALITY_LABELS[modality] ?? '---');
	}

	function triageRowLabel(entry: TriageHistoryEntry, open: boolean): string {
		const action = open ? 'Ocultar detalhes' : 'Mostrar detalhes';
		return `${action} da triagem de ${formatDateTime(entry.occurredAt)}`;
	}

	function mappingRowLabel(entry: MappingHistoryEntry, open: boolean): string {
		const action = open ? 'Ocultar detalhes' : 'Mostrar detalhes';
		return `${action} do mapeamento de ${formatDateTime(entry.occurredAt)}`;
	}
</script>

<section class="history-tables" aria-label="Históricos de triagem e mapeamento">
	{#if triages.length === 0}
		<p class="history-empty">Nenhuma triagem registrada.</p>
	{:else}
		<button
			type="button"
			class="disclosure"
			aria-expanded={triagesOpen}
			aria-controls="triages-panel"
			onclick={onToggleTriages}
		>
			<span class="disclosure-icon" aria-hidden="true"
				><Icon iconName="filter" iconSize="sm" /></span
			>
			<span>Triagens ({triages.length})</span>
			<Icon iconName={triagesOpen ? 'expandLess' : 'expandMore'} iconSize="sm" />
		</button>
		<div id="triages-panel" class="disclosure-panel" hidden={!triagesOpen}>
			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th scope="col">Data</th>
							<th scope="col">Resultado</th>
							<th scope="col"><span class="sr-only">Detalhes</span></th>
						</tr>
					</thead>
					<tbody>
						{#each triages as entry (entry.triage.id)}
							{@const open = openTriageId === entry.triage.id}
							<tr class="body-row" class:open onclick={() => onToggleTriageRow(entry.triage.id)}>
								<td><time datetime={entry.occurredAt}>{formatDateTime(entry.occurredAt)}</time></td>
								<td>{entry.triage.result || '---'}</td>
								<td class="toggle-cell">
									<button
										id={`triage-row-${entry.triage.id}`}
										type="button"
										class="row-toggle"
										aria-expanded={open}
										aria-controls={`triage-detail-${entry.triage.id}`}
										aria-label={triageRowLabel(entry, open)}
										onclick={(event) => {
											event.stopPropagation();
											onToggleTriageRow(entry.triage.id);
										}}
									>
										<Icon iconName={open ? 'expandLess' : 'expandMore'} iconSize="sm" />
									</button>
								</td>
							</tr>
							{#if open}
								<tr class="detail-row">
									<td colspan="3">
										<dl class="record-fields">
											<div>
												<dt>Aderente ao escopo</dt>
												<dd>{entry.triage.adherentToScope || '---'}</dd>
											</div>
											<div>
												<dt>Mudança de categoria</dt>
												<dd>{entry.triage.changeCategory || '---'}</dd>
											</div>
											<div>
												<dt>Status de saída</dt>
												<dd>{exitStatusLabel(entry.triage.exitStatus)}</dd>
											</div>
											<div>
												<dt>Nova categoria</dt>
												<dd>{entry.triage.newCategory || '---'}</dd>
											</div>
											<div>
												<dt>Responsável sugerido</dt>
												<dd>{entry.triage.suggestedResponsible || '---'}</dd>
											</div>
											<div>
												<dt>Justificativa de aderência</dt>
												<dd>{entry.triage.adherentJustification || '---'}</dd>
											</div>
											<div class="full">
												<dt>Complexidade preliminar</dt>
												<dd>{entry.triage.preliminaryComplexity || '---'}</dd>
											</div>
											<div class="full">
												<dt>Riscos percebidos</dt>
												<dd>{entry.triage.perceivedRisks || '---'}</dd>
											</div>
											<div class="full">
												<dt>Justificativa do responsável sugerido</dt>
												<dd>{entry.triage.suggestedResponsibleJustification || '---'}</dd>
											</div>
											<div class="full">
												<dt>Resultado</dt>
												<dd>{entry.triage.result || '---'}</dd>
											</div>
											<div class="full">
												<dt>Justificativa da conclusão</dt>
												<dd>{entry.triage.conclusionJustification || '---'}</dd>
											</div>
										</dl>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if mappings.length === 0}
		<p class="history-empty">Nenhum mapeamento registrado.</p>
	{:else}
		<button
			type="button"
			class="disclosure"
			aria-expanded={mappingsOpen}
			aria-controls="mappings-panel"
			onclick={onToggleMappings}
		>
			<span class="disclosure-icon" aria-hidden="true">
				<Icon iconName="calendarCheck" iconSize="sm" />
			</span>
			<span>Mapeamentos ({mappings.length})</span>
			<Icon iconName={mappingsOpen ? 'expandLess' : 'expandMore'} iconSize="sm" />
		</button>
		<div id="mappings-panel" class="disclosure-panel" hidden={!mappingsOpen}>
			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th scope="col">Data</th>
							<th scope="col">Agendamento</th>
							<th scope="col">Responsável</th>
							<th scope="col"><span class="sr-only">Detalhes</span></th>
						</tr>
					</thead>
					<tbody>
						{#each mappings as entry (entry.mapping.id ?? `mapping-${entry.occurredAt}`)}
							{@const open = openMappingId === (entry.mapping.id ?? `mapping-${entry.occurredAt}`)}
							<tr
								class="body-row"
								class:open
								onclick={() =>
									onToggleMappingRow(entry.mapping.id ?? `mapping-${entry.occurredAt}`)}
							>
								<td><time datetime={entry.occurredAt}>{formatDateTime(entry.occurredAt)}</time></td>
								<td>
									{entry.mapping.scheduledFor ? formatDateTime(entry.mapping.scheduledFor) : '---'}
								</td>
								<td>{entry.mapping.mappingAssignee?.name ?? '---'}</td>
								<td class="toggle-cell">
									<button
										id={`mapping-row-${entry.mapping.id ?? `mapping-${entry.occurredAt}`}`}
										type="button"
										class="row-toggle"
										aria-expanded={open}
										aria-controls={`mapping-detail-${entry.mapping.id ?? `mapping-${entry.occurredAt}`}`}
										aria-label={mappingRowLabel(entry, open)}
										onclick={(event) => {
											event.stopPropagation();
											onToggleMappingRow(entry.mapping.id ?? `mapping-${entry.occurredAt}`);
										}}
									>
										<Icon iconName={open ? 'expandLess' : 'expandMore'} iconSize="sm" />
									</button>
								</td>
							</tr>
							{#if open}
								<tr class="detail-row">
									<td colspan="4">
										<dl class="record-fields">
											<div>
												<dt>Agendamento</dt>
												<dd>
													{entry.mapping.scheduledFor
														? formatDateTime(entry.mapping.scheduledFor)
														: '---'}
												</dd>
											</div>
											<div>
												<dt>Duração</dt>
												<dd>{durationLabel(entry.mapping.durationMinutes)}</dd>
											</div>
											<div>
												<dt>Modalidade</dt>
												<dd>{modalityLabel(entry.mapping.modality)}</dd>
											</div>
											<div>
												<dt>Responsável</dt>
												<dd>
													{#if entry.mapping.mappingAssignee}
														{entry.mapping.mappingAssignee.name}{entry.mapping.mappingAssignee
															.jobTitle
															? ` · ${entry.mapping.mappingAssignee.jobTitle}`
															: ''}
													{:else}
														---
													{/if}
												</dd>
											</div>
											<div class="full">
												<dt>Local</dt>
												<dd>{entry.mapping.location || '---'}</dd>
											</div>
											<div class="full">
												<dt>Link da reunião</dt>
												<dd>
													{#if entry.mapping.meetingLink}
														<a
															href={entry.mapping.meetingLink}
															target="_blank"
															rel="external noopener noreferrer">{entry.mapping.meetingLink}</a
														>
													{:else}
														---
													{/if}
												</dd>
											</div>
											<div class="full">
												<dt>Participantes</dt>
												<dd>
													{#if entry.mapping.participants.length === 0}
														---
													{:else}
														<ul class="participants">
															{#each entry.mapping.participants as participant (participant.email)}
																<li>{participant.name} — {participant.email}</li>
															{/each}
														</ul>
													{/if}
												</dd>
											</div>
											<div class="full">
												<dt>Notas</dt>
												<dd>{entry.mapping.notes || '---'}</dd>
											</div>
										</dl>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</section>

<style>
	.history-tables {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--white);
		border-top: var(--border-default);
	}

	.history-empty {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--gray);
	}

	.disclosure {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--background-color);
		color: var(--primary-color);
		font-family: var(--font-montserrat);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		text-align: left;
	}

	.disclosure:hover {
		border-color: var(--primary-color);
	}

	.disclosure:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.disclosure :global(svg),
	.disclosure :global(.material-symbols-outlined) {
		margin-left: auto;
	}

	.disclosure-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--status-blue-bg);
		color: var(--primary-color);
		flex-shrink: 0;
	}

	.disclosure-icon + span {
		margin-right: auto;
	}

	.disclosure-panel {
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.disclosure-panel[hidden] {
		display: none;
	}

	.table-scroll {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-inter);
		font-size: 13px;
	}

	thead th {
		padding: 8px 10px;
		text-align: left;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--gray);
		background: var(--background-color);
		border-bottom: var(--border-default);
		white-space: nowrap;
	}

	.body-row {
		cursor: pointer;
	}

	.body-row:hover td {
		background: var(--white-gray);
	}

	tbody td {
		padding: 8px 10px;
		color: var(--black);
		border-bottom: 1px solid var(--white-gray);
		vertical-align: top;
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	tbody tr.open td {
		background: var(--background-color);
	}

	.toggle-cell {
		width: 36px;
		text-align: center;
	}

	.row-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
		color: var(--primary-color);
		cursor: pointer;
	}

	.row-toggle:hover {
		border-color: var(--primary-color);
	}

	.row-toggle:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.detail-row td {
		background: var(--background-color);
		border-bottom: 1px solid var(--white-gray);
	}

	.record-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px 12px;
		margin: 0;
		padding: 4px 2px;
	}

	.record-fields .full {
		grid-column: 1 / -1;
	}

	.record-fields div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.record-fields dt {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--gray);
	}

	.record-fields dd {
		margin: 0;
		font-size: 13px;
		color: var(--black);
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}

	.record-fields a {
		color: var(--primary-color);
		overflow-wrap: anywhere;
	}

	.participants {
		margin: 0;
		padding-left: 16px;
	}

	.participants li {
		overflow-wrap: anywhere;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 640px) {
		.history-tables {
			padding: var(--spacing-sm);
		}

		.record-fields {
			grid-template-columns: 1fr;
		}
	}
</style>
