<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { saveStatuses } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import {
		STATUS_TONES,
		type PortalStatus,
		type StatusesSection,
		type StatusTone,
		type StatusVisibility
	} from '$lib/types/portal-config';
	import { nextId, removeById, replaceById } from '$lib/utils/lists';
	import {
		areStatusNamesUnique,
		isValidStatusName,
		MAX_STATUSES,
		MAX_STATUS_NAME_LENGTH
	} from '$lib/utils/validations';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<StatusesSection>(
		{ statuses: page.data.portalConfig.statuses },
		{ statuses: DEFAULT_PORTAL_CONFIG.statuses },
		(draft) => saveStatuses({ statuses: draft.statuses })
	);

	// Erro global da lista (Card 6) — lista vazia, limite de itens, nome
	// inválido ou nome duplicado.
	const statusesError: string | null = $derived.by(() => {
		const statuses = section.draft.statuses;

		if (statuses.length === 0) return 'Adicione ao menos um status.';
		if (statuses.length > MAX_STATUSES) return `O limite é de ${MAX_STATUSES} status.`;
		if (statuses.some((status) => !isValidStatusName(status.name))) {
			return 'Preencha o nome (até 40 caracteres) de cada status.';
		}
		if (!areStatusNamesUnique(statuses)) return 'Nomes de status não podem se repetir.';
		return null;
	});

	const invalid = $derived(statusesError !== null);

	function setStatuses(statuses: PortalStatus[]) {
		section.draft = { statuses };
		section.clearFeedback();
	}

	function addStatus() {
		setStatuses([
			...section.draft.statuses,
			{
				id: nextId(section.draft.statuses),
				name: '',
				visibility: 'PUBLIC',
				closesRequest: false,
				tone: 'info'
			}
		]);
	}

	function updateStatus(
		id: number,
		patch: Partial<Pick<PortalStatus, 'name' | 'visibility' | 'closesRequest' | 'tone'>>
	) {
		setStatuses(replaceById<PortalStatus>(section.draft.statuses, id, patch));
	}

	function removeStatus(id: number) {
		setStatuses(removeById(section.draft.statuses, id));
	}

	// Status em edição (valores locais do formulário); `null` = nenhum.
	let editing = $state<{
		id: number;
		name: string;
		visibility: StatusVisibility;
		closesRequest: boolean;
		tone: StatusTone;
	} | null>(null);

	const VISIBILITY_OPTIONS: { value: StatusVisibility; label: string }[] = [
		{ value: 'PUBLIC', label: 'Público' },
		{ value: 'INTERNAL', label: 'Interno' }
	];

	const TONE_LABELS: Record<StatusTone, string> = {
		error: 'Erro',
		success: 'Sucesso',
		info: 'Informação',
		warning: 'Alerta',
		neutral: 'Neutro'
	};

	function handleAdd() {
		addStatus();
		const statuses = section.draft.statuses;
		const added = statuses[statuses.length - 1];
		editing = added
			? {
					id: added.id,
					name: added.name,
					visibility: added.visibility,
					closesRequest: added.closesRequest,
					tone: added.tone
				}
			: null;
	}

	function handleEdit(status: PortalStatus) {
		editing = {
			id: status.id,
			name: status.name,
			visibility: status.visibility,
			closesRequest: status.closesRequest,
			tone: status.tone
		};
	}

	function handleSaveEdit() {
		if (!editing) return;
		updateStatus(editing.id, {
			name: editing.name,
			visibility: editing.visibility,
			closesRequest: editing.closesRequest,
			tone: editing.tone
		});
		editing = null;
	}

	function handleCancelEdit(status: PortalStatus) {
		// Cancelar um status recém-adicionado (ainda sem nome) remove a linha.
		if (status.name.trim() === '') {
			removeStatus(status.id);
		}
		editing = null;
	}

	// Só permite remover a última linha de status restante.
	function canRemoveStatus(): boolean {
		return section.draft.statuses.length > 1;
	}
</script>

<SettingsCard
	iconName="pending"
	title="6. Status"
	description="Configure os status do ciclo de vida das solicitações."
>
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			{invalid}
			feedback={section.feedback}
			onSave={() => section.save()}
			onCancel={() => section.reset()}
			onRestoreDefaults={() => section.restoreDefaults()}
		/>
	{/snippet}

	{#snippet headerAction()}
		<Button
			variant="secondary"
			disabled={section.saving || section.draft.statuses.length >= MAX_STATUSES}
			onclick={handleAdd}
		>
			<Icon iconName="addCircle" iconSize="sm" />
			<span>Adicionar status</span>
		</Button>
	{/snippet}

	{#if statusesError}
		<p class="status-error" role="alert">{statusesError}</p>
	{/if}

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
				{#each section.draft.statuses as status (status.id)}
					<tr class="tone-{status.tone}">
						<td class="col-name">
							<span class="name-field">
								<span class="status-dot" aria-hidden="true"></span>
								{#if editing && editing.id === status.id}
									<input
										class="edit-input"
										type="text"
										maxlength={MAX_STATUS_NAME_LENGTH}
										aria-label="Nome do status"
										bind:value={editing.name}
									/>
								{:else}
									{status.name}
								{/if}
							</span>
						</td>
						<td class="col-visibility">
							{#if editing && editing.id === status.id}
								<select
									class="edit-select"
									aria-label="Visibilidade do status"
									bind:value={editing.visibility}
								>
									{#each VISIBILITY_OPTIONS as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							{:else}
								<span class="visibility-badge">
									{status.visibility === 'PUBLIC' ? 'Público' : 'Interno'}
								</span>
							{/if}
						</td>
						<td class="col-closes">
							{#if editing && editing.id === status.id}
								<select
									class="edit-select"
									aria-label="Encerramento do status"
									bind:value={editing.closesRequest}
								>
									<option value={false}>Não</option>
									<option value={true}>Sim</option>
								</select>
							{:else}
								{status.closesRequest ? 'Sim' : 'Não'}
							{/if}
						</td>
						<td class="col-tone">
							{#if editing && editing.id === status.id}
								<select
									class="edit-select"
									aria-label="Tom visual do status"
									bind:value={editing.tone}
								>
									{#each STATUS_TONES as tone (tone)}
										<option value={tone}>{TONE_LABELS[tone]}</option>
									{/each}
								</select>
							{:else}
								<span class="tone-badge">
									<span class="tone-dot" aria-hidden="true"></span>
									{TONE_LABELS[status.tone]}
								</span>
							{/if}
						</td>
						<td class="col-actions">
							{#if editing && editing.id === status.id}
								<button
									class="icon-btn"
									type="button"
									aria-label="Salvar status"
									onclick={handleSaveEdit}
								>
									<Icon iconName="check" iconSize="sm" />
								</button>
								<button
									class="icon-btn"
									type="button"
									aria-label="Cancelar edição"
									onclick={() => handleCancelEdit(status)}
								>
									<Icon iconName="close" iconSize="sm" />
								</button>
							{:else}
								<button
									class="icon-btn"
									type="button"
									aria-label="Editar status"
									disabled={section.saving}
									onclick={() => handleEdit(status)}
								>
									<Icon iconName="edit" iconSize="sm" />
								</button>
								<button
									class="icon-btn"
									type="button"
									aria-label="Remover status"
									disabled={section.saving || !canRemoveStatus()}
									onclick={() => removeStatus(status.id)}
								>
									<Icon iconName="delete" iconSize="sm" />
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</SettingsCard>

<style>
	.status-error {
		margin: 0;
		font-size: 13px;
		color: var(--status-red);
	}

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
		width: 32%;
	}

	.col-visibility {
		width: 16%;
	}

	td.col-closes {
		width: 18%;
		color: var(--secondary-color);
		font-size: 13px;
		text-align: center;
	}

	.col-tone {
		width: 15%;
	}

	td.col-tone {
		text-align: center;
	}

	.col-actions {
		width: 19%;
		text-align: end;
		white-space: nowrap;
	}

	.name-field {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.name-field .edit-input {
		flex: 1;
		min-width: 0;
	}

	.status-dot {
		display: inline-flex;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--tone-family);
		margin-right: var(--spacing-sm);
		vertical-align: middle;
		flex-shrink: 0;
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

	.edit-input {
		width: 100%;
		box-sizing: border-box;
		padding: 4px 8px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font-size: 14px;
		color: var(--rich-black);
	}

	.edit-select {
		width: 100%;
		box-sizing: border-box;
		padding: 4px 8px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font-size: 13px;
		color: var(--rich-black);
		background-color: var(--white);
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: var(--spacing-sm);
		padding: 4px;
		border: none;
		border-radius: var(--radius-sm);
		background-color: transparent;
		color: var(--gray);
		cursor: pointer;
	}

	.icon-btn:hover:not(:disabled) {
		background-color: var(--background-color);
		color: var(--secondary-color);
	}

	.icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.tone-error {
		--tone-family: var(--status-error);
		--tone-bg: var(--status-error-bg);
		--tone-border: color-mix(in srgb, var(--status-error) 30%, transparent);
	}

	.tone-success {
		--tone-family: var(--status-success);
		--tone-bg: var(--status-success-bg);
		--tone-border: color-mix(in srgb, var(--status-success) 30%, transparent);
	}

	.tone-info {
		--tone-family: var(--status-info);
		--tone-bg: var(--status-info-bg);
		--tone-border: color-mix(in srgb, var(--status-info) 30%, transparent);
	}

	.tone-warning {
		--tone-family: var(--status-warning);
		--tone-bg: var(--status-warning-bg);
		--tone-border: color-mix(in srgb, var(--status-warning) 30%, transparent);
	}

	.tone-neutral {
		--tone-family: var(--status-neutral);
		--tone-bg: var(--status-neutral-bg);
		--tone-border: color-mix(in srgb, var(--status-neutral) 30%, transparent);
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
