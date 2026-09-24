<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import BadgeSelect from '$lib/components/BadgeSelect.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import LegendPill from '$lib/components/LegendPill.svelte';
	import ToggleButton from '$lib/components/ToggleButton.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { isPortalConfigLoadBlocked } from '$lib/config/portal-config-load';
	import { saveStatuses } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import {
		STATUS_TONES,
		STATUS_MODES,
		type PortalStatus,
		type StatusesSection,
		type StatusTone,
		type StatusMode
	} from '$lib/types/portal-config';
	import { nextId, removeById, replaceById } from '$lib/utils/lists';
	import {
		areStatusNamesUnique,
		isValidStatusName,
		MAX_STATUSES,
		MAX_STATUS_NAME_LENGTH
	} from '$lib/utils/validations';
	import { notifyError, notifySectionSave } from '$lib/utils/feedback';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<StatusesSection>(
		{ statuses: page.data.portalConfig.statuses },
		{ statuses: DEFAULT_PORTAL_CONFIG.statuses },
		(draft) => saveStatuses({ statuses: draft.statuses })
	);

	const loadFailed = $derived(isPortalConfigLoadBlocked(page.data));

	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const ROW_TRANSITION_MS = prefersReducedMotion ? 0 : 220;

	const statusesError: string | null = $derived.by(() => {
		const statuses = section.draft.statuses;
		if (statuses.length === 0) return 'Adicione ao menos um status.';
		if (statuses.length > MAX_STATUSES) return `O limite é de ${MAX_STATUSES} status.`;
		if (statuses.some((s) => !isValidStatusName(s.name))) {
			return 'Preencha o nome (até 40 caracteres) de cada status.';
		}
		if (!areStatusNamesUnique(statuses)) return 'Nomes de status não podem se repetir.';
		if (statuses.some((s) => s.isCore && !s.isActive))
			return 'Status vital (isCore) não pode ser inativado.';
		const restrictedConflict = statuses.find(
			(s) => s.isRestricted && (s.triageMode !== 'none' || s.mappingMode !== 'none')
		);
		if (restrictedConflict) {
			return `O status “${restrictedConflict.name}” está Restrito mas tem ${configuredModes(restrictedConflict)}. Defina ambos como “—” antes de salvar.`;
		}
		return null;
	});

	const invalid = $derived(statusesError !== null);

	const hasPendingStatus = $derived(
		section.draft.statuses.some((status) => status.name.trim() === '')
	);

	function statusRowError(name: string, id: number): string | null {
		if (!isValidStatusName(name)) return 'Preencha o nome do status (até 40 caracteres).';
		const duplicated = section.draft.statuses.some(
			(status) => status.id !== id && status.name.trim().toLowerCase() === name.trim().toLowerCase()
		);
		if (duplicated) return 'Nomes de status não podem se repetir.';
		return null;
	}

	function setStatuses(statuses: PortalStatus[]) {
		section.draft = { statuses };
	}

	async function handleSave() {
		if (loadFailed) return;
		notifySectionSave(await section.save());
	}

	function addStatus() {
		setStatuses([
			{
				id: nextId(section.draft.statuses),
				name: '',
				isCore: false,
				isPublic: false,
				isTerminal: false,
				triageMode: 'none',
				mappingMode: 'none',
				isRestricted: false,
				tone: 'info',
				isActive: true
			},
			...section.draft.statuses
		]);
	}

	function updateStatus(id: number, patch: Partial<PortalStatus>) {
		setStatuses(replaceById<PortalStatus>(section.draft.statuses, id, patch));
	}

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function openSelectPicker(_node: HTMLElement) {
		return () => {};
	}

	type EditableStatusField = 'name';
	let editingCell = $state<{ id: number; field: EditableStatusField } | null>(null);
	let editingName = $state('');

	let nameError = $state(false);
	const nameInvalid = $derived(
		nameError && editingCell?.field === 'name' && !isValidStatusName(editingName)
	);

	type BooleanFilter = 'all' | 'true' | 'false';
	let showInactive = $state(false);
	let isTerminalFilter = $state<BooleanFilter>('all');
	let triageModeFilter = $state<StatusMode | 'all'>('all');
	let mappingModeFilter = $state<StatusMode | 'all'>('all');
	let showRestrictedOnly = $state(false);

	const visibleStatuses = $derived(
		section.draft.statuses.filter(
			(status) =>
				(showInactive || status.isActive) &&
				(isTerminalFilter === 'all' || String(status.isTerminal) === isTerminalFilter) &&
				(triageModeFilter === 'all' || status.triageMode === triageModeFilter) &&
				(mappingModeFilter === 'all' || status.mappingMode === mappingModeFilter) &&
				(!showRestrictedOnly || status.isRestricted)
		)
	);
	const inactiveCount = $derived(section.draft.statuses.filter((s) => !s.isActive).length);
	const hasActiveFilters = $derived(
		isTerminalFilter !== 'all' ||
			triageModeFilter !== 'all' ||
			mappingModeFilter !== 'all' ||
			showRestrictedOnly
	);

	function clearFilters() {
		isTerminalFilter = 'all';
		triageModeFilter = 'all';
		mappingModeFilter = 'all';
		showRestrictedOnly = false;
	}

	const BOOLEAN_FILTER_LABELS: Record<BooleanFilter, string> = {
		all: 'Todas',
		true: 'Sim',
		false: 'Não'
	};

	function cycleBooleanFilter(which: 'isTerminal') {
		const next = (current: BooleanFilter): BooleanFilter =>
			current === 'all' ? 'true' : current === 'true' ? 'false' : 'all';
		if (which === 'isTerminal') {
			isTerminalFilter = next(isTerminalFilter);
		}
	}

	function canToggleInactive(status: PortalStatus): boolean {
		if (status.isCore) return false;
		if (!status.isActive) return true;
		return section.draft.statuses.filter((item) => item.isActive).length > 1;
	}

	function canEditName(status: PortalStatus): boolean {
		return !status.isCore;
	}

	function toggleActive(status: PortalStatus) {
		if (!canToggleInactive(status)) {
			notifyError(
				status.isCore
					? 'Status vital não pode ser inativado.'
					: 'Ao menos um status deve permanecer ativo.'
			);
			return;
		}
		updateStatus(status.id, { isActive: !status.isActive });
	}

	function popToggle(event: MouseEvent) {
		if (prefersReducedMotion) return;
		const target = event.currentTarget as HTMLElement | null;
		target?.animate(
			[
				{ transform: 'scale(0.88)' },
				{ transform: 'scale(1.04)', offset: 0.6 },
				{ transform: 'scale(1)' }
			],
			{ duration: 180, easing: 'ease-out' }
		);
	}

	const STATUS_MODE_LABELS: Record<StatusMode, string> = {
		none: '—',
		free: 'Livre',
		conclusion_only: 'Conclusão'
	};

	// Descreve, com os rótulos que o usuário vê, quais modos impedem marcar o
	// status como Restrito (o contrato exige Triagem e Mapeamento em “—”).
	function configuredModes(status: PortalStatus): string {
		const parts: string[] = [];
		if (status.triageMode !== 'none') {
			parts.push(`Triagem como “${STATUS_MODE_LABELS[status.triageMode]}”`);
		}
		if (status.mappingMode !== 'none') {
			parts.push(`Mapeamento como “${STATUS_MODE_LABELS[status.mappingMode]}”`);
		}
		return parts.join(' e ');
	}

	// Mensagem exibida ao tentar escolher um modo enquanto o status está Restrito:
	// nomeia o status e explica que Restrito só admite os modos em “—” (o caminho
	// de saída é desativar Restrito).
	function restrictedModeChangeMessage(status: PortalStatus, value: string): string {
		const label = STATUS_MODE_LABELS[value as StatusMode] ?? value;
		return `O status “${status.name}” está como Restrito e só permite Triagem e Mapeamento em “—”. Desative Restrito para escolher “${label}”.`;
	}

	const TONE_LABELS: Record<StatusTone, string> = {
		error: 'Erro',
		success: 'Sucesso',
		info: 'Informação',
		warning: 'Alerta',
		neutral: 'Neutro'
	};

	function handleAdd() {
		addStatus();
		const added = section.draft.statuses[0];
		if (!added) return;
		editingCell = { id: added.id, field: 'name' };
		editingName = added.name;
		nameError = false;
	}

	function openCellEditor(status: PortalStatus, field: EditableStatusField) {
		if (section.saving || loadFailed) return;
		if (field === 'name' && !canEditName(status)) {
			notifyError('Status vital não pode ser renomeado.');
			return;
		}
		editingCell = { id: status.id, field };
		nameError = false;
		editingName = status.name;
	}

	function closeCellEditor() {
		editingCell = null;
		nameError = false;
	}

	function commitNameEdit(status: PortalStatus) {
		const error = statusRowError(editingName, status.id);
		if (error) {
			nameError = true;
			notifyError(error);
			return;
		}
		if (status.isCore && editingName.trim() !== status.name) {
			notifyError('Status vital não pode ser renomeado.');
			return;
		}
		updateStatus(status.id, { name: editingName.trim() });
		closeCellEditor();
	}

	function cancelNameEdit(status: PortalStatus) {
		if (status.name.trim() === '') {
			setStatuses(removeById(section.draft.statuses, status.id));
		}
		closeCellEditor();
	}

	function commitCellSelect(
		status: PortalStatus,
		field: 'triageMode' | 'mappingMode' | 'tone',
		value: string
	) {
		switch (field) {
			case 'triageMode':
				if (status.isRestricted && value !== 'none') {
					notifyError(restrictedModeChangeMessage(status, value));
					break;
				}
				updateStatus(status.id, { triageMode: value as StatusMode });
				break;
			case 'mappingMode':
				if (status.isRestricted && value !== 'none') {
					notifyError(restrictedModeChangeMessage(status, value));
					break;
				}
				updateStatus(status.id, { mappingMode: value as StatusMode });
				break;
			case 'tone':
				updateStatus(status.id, { tone: value as StatusTone });
				break;
		}
		closeCellEditor();
	}
</script>

<SettingsCard
	iconName="pending"
	title="7. Status"
	description="Defina como cada status aparece, quem vê, se finaliza, onde pode ser usado e sua cor. Identidade: nome; Vital: travados; Visibilidade: quem vê; Encerramento: se finaliza; Fluxo: onde pode ser escolhido; Tema: cor personalizável no tema."
>
	{#snippet titleAddon()}
		<InfoTip
			label="Como funciona cada grupo"
			text="Identidade: nome na lista. Vital são 6 travados com cadeado. Visibilidade: quem enxerga — público todo mundo vê, interno só equipe (solicitante segue no último público). Encerramento: se a demanda acaba (qualquer status pode ser final). Fluxo: onde você consegue mover (Livre a qualquer momento, Conclusão só ao finalizar Triagem/Mapeamento, Restrito só Admin). Tema: só a cor, personalizável no tema claro/escuro."
		/>
	{/snippet}
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			restorable={section.restorable}
			{invalid}
			{loadFailed}
			onSave={handleSave}
			onCancel={() => section.reset()}
			onRestoreDefaults={() => section.restoreDefaults()}
		/>
	{/snippet}

	<div class="status-groups-legend" role="group" aria-label="Legenda dos grupos">
		<LegendPill
			label="Identidade"
			variant="identidade"
			tooltip="O nome que aparece para quem solicitou e na linha do tempo."
		/>
		<LegendPill
			label="Vital"
			variant="encerramento"
			tooltip="Cadeado significa travado: 7 opções que não podem ser apagadas, renomeadas ou desativadas — Solicitação enviada, Em triagem, Pendente de informações, Mapeamento agendado, Em mapeamento, Concluído e Cancelado."
		/>
		<LegendPill
			label="Visibilidade"
			variant="visibilidade"
			tooltip="Quem vê: público todo mundo vê; interno só a equipe vê — quem solicitou segue no último público."
		/>
		<LegendPill
			label="Encerramento"
			variant="encerramento"
			tooltip="Indica que a demanda acaba nesse status."
		/>
		<LegendPill
			label="Fluxo"
			variant="ciclo"
			tooltip="Onde pode ser escolhido: Livre a qualquer momento no Alterar status, Conclusão só ao finalizar Triagem ou Mapeamento, Restrito só quem administra."
		/>
		<LegendPill
			label="Tema"
			variant="tema"
			tooltip="Apenas a cor do selo. Escolha o tom e pode ser personalizada nas configurações de tema (claro/escuro)."
		/>
	</div>

	<div class="status-toolbar">
		<Button
			variant="secondary"
			disabled={section.saving ||
				loadFailed ||
				section.draft.statuses.length >= MAX_STATUSES ||
				hasPendingStatus}
			onclick={handleAdd}
		>
			<Icon iconName="addCircle" iconSize="sm" />
			<span>Adicionar status</span>
		</Button>

		<ToggleButton
			pressed={showInactive}
			label="Mostrar inativos"
			pressedLabel="Ocultar inativos"
			count={inactiveCount}
			onclick={() => (showInactive = !showInactive)}
		/>
	</div>

	<div class="status-filters" role="group" aria-label="Filtros da tabela de status">
		<span class="filter-label">Filtrar por:</span>
		<button
			type="button"
			class="filter-pill"
			class:selected={isTerminalFilter !== 'all'}
			aria-label="Filtro terminal: {BOOLEAN_FILTER_LABELS[isTerminalFilter]}"
			onclick={() => cycleBooleanFilter('isTerminal')}
			title="Filtra status que encerram a solicitação (só Concluído/Cancelado)"
		>
			Terminal: {BOOLEAN_FILTER_LABELS[isTerminalFilter]}
		</button>
		<select
			class="filter-select filter-pill"
			class:selected={triageModeFilter !== 'all'}
			aria-label="Filtro triagem"
			bind:value={triageModeFilter}
			title="Filtra por uso na Triagem: Livre (operacional) ou Conclusão (só ao concluir)"
		>
			<option value="all">Triagem: Todas</option>
			{#each STATUS_MODES as m (m)}<option value={m}>Triagem: {STATUS_MODE_LABELS[m]}</option
				>{/each}
		</select>
		<select
			class="filter-select filter-pill"
			class:selected={mappingModeFilter !== 'all'}
			aria-label="Filtro mapeamento"
			bind:value={mappingModeFilter}
			title="Filtra por uso no Mapeamento: Livre ou Conclusão"
		>
			<option value="all">Mapeamento: Todas</option>
			{#each STATUS_MODES as m (m)}<option value={m}>Mapeamento: {STATUS_MODE_LABELS[m]}</option
				>{/each}
		</select>
		<button
			type="button"
			class="filter-pill"
			class:selected={showRestrictedOnly}
			aria-pressed={showRestrictedOnly}
			aria-label="Filtro restrito"
			title="Mostra apenas Priorizado (restrito a Admin)"
			onclick={() => (showRestrictedOnly = !showRestrictedOnly)}
		>
			{showRestrictedOnly ? 'Só restritos' : 'Restrito: Todos'}
		</button>
		{#if hasActiveFilters}
			<button
				type="button"
				class="clear-filters"
				transition:fade={{ duration: ROW_TRANSITION_MS }}
				onclick={clearFilters}
			>
				Limpar filtros
			</button>
		{/if}
	</div>

	{#if statusesError && !editingCell}
		<p class="status-error" role="alert">{statusesError}</p>
	{/if}

	<div class="status-table" role="region" aria-label="Tabela de status v4">
		<table>
			<thead>
				<tr>
					<th scope="col" class="col-name">Nome (Identidade)</th>
					<th scope="col" class="col-public">Público</th>
					<th scope="col" class="col-terminal">Terminal</th>
					<th scope="col" class="col-mode">Triagem</th>
					<th scope="col" class="col-mode">Mapeamento</th>
					<th scope="col" class="col-restricted">Restrito</th>
					<th scope="col" class="col-tone">Tom</th>
					<th scope="col" class="col-actions">Ativo</th>
				</tr>
			</thead>
			<tbody>
				{#each visibleStatuses as status (status.id)}
					<tr
						class="tone-{status.tone}"
						class:is-core={status.isCore}
						in:fade={{ duration: ROW_TRANSITION_MS }}
						out:fade={{ duration: ROW_TRANSITION_MS }}
						animate:flip={{ duration: ROW_TRANSITION_MS }}
					>
						<td class="col-name">
							<span class="name-field">
								{#if status.isCore}
									<span
										class="status-icon is-core"
										title="Vital — não renomeia/inativa (cor do status)"
										aria-label="vital"><Icon iconName="lock" iconSize="sm" /></span
									>
								{:else}
									<span class="status-dot" aria-hidden="true"></span>
								{/if}
								{#if editingCell?.id === status.id && editingCell.field === 'name'}
									<input
										class="edit-input"
										class:invalid={nameInvalid}
										type="text"
										maxlength={MAX_STATUS_NAME_LENGTH}
										aria-label="Nome do status"
										aria-invalid={nameInvalid}
										{@attach focusOnMount}
										bind:value={editingName}
										onkeydown={(event) => {
											if (event.key === 'Enter') commitNameEdit(status);
											else if (event.key === 'Escape') cancelNameEdit(status);
										}}
										onblur={() => commitNameEdit(status)}
									/>
								{:else}
									<button
										type="button"
										class="cell-button name-button"
										aria-label="Editar nome de {status.name}"
										disabled={section.saving || loadFailed || !canEditName(status)}
										onclick={() => openCellEditor(status, 'name')}
									>
										<span class="cell-text">{status.name}</span>
									</button>
								{/if}
							</span>
						</td>
						<td class="col-public">
							<button
								type="button"
								class="tipo-pill"
								class:on={status.isPublic}
								aria-pressed={status.isPublic}
								aria-label="Visível público de {status.name}"
								disabled={section.saving || loadFailed}
								onclick={(event) => {
									popToggle(event);
									updateStatus(status.id, { isPublic: !status.isPublic });
								}}
							>
								{status.isPublic ? 'Público' : 'Interno'}
							</button>
						</td>
						<td class="col-terminal">
							<button
								type="button"
								class="tipo-pill"
								class:on={status.isTerminal}
								aria-pressed={status.isTerminal}
								aria-label="Terminal de {status.name}"
								disabled={section.saving || loadFailed}
								onclick={(event) => {
									popToggle(event);
									updateStatus(status.id, { isTerminal: !status.isTerminal });
								}}
							>
								{status.isTerminal ? 'Sim' : 'Não'}
							</button>
						</td>
						<td class="col-mode">
							<BadgeSelect
								value={status.triageMode}
								options={STATUS_MODES.map((m) => ({
									value: m,
									label: STATUS_MODE_LABELS[m as StatusMode]
								}))}
								variant="mode"
								ariaLabel={`Triagem de ${status.name}`}
								disabled={section.saving ||
									loadFailed ||
									(status.isRestricted && status.triageMode === 'none')}
								onChange={(v) => commitCellSelect(status, 'triageMode', v)}
							/>
						</td>
						<td class="col-mode">
							<BadgeSelect
								value={status.mappingMode}
								options={STATUS_MODES.map((m) => ({
									value: m,
									label: STATUS_MODE_LABELS[m as StatusMode]
								}))}
								variant="mode"
								ariaLabel={`Mapeamento de ${status.name}`}
								disabled={section.saving ||
									loadFailed ||
									(status.isRestricted && status.mappingMode === 'none')}
								onChange={(v) => commitCellSelect(status, 'mappingMode', v)}
							/>
						</td>
						<td class="col-restricted">
							<button
								type="button"
								class="tipo-pill"
								class:on={status.isRestricted}
								aria-pressed={status.isRestricted}
								aria-label="Restrito de {status.name}"
								disabled={section.saving || loadFailed}
								onclick={(event) => {
									popToggle(event);
									if (!status.isRestricted) {
										const configured = configuredModes(status);
										if (configured) {
											notifyError(
												`O status “${status.name}” não pode ser restrito enquanto tiver ${configured}. Defina ambos como “—” para ativar Restrito.`
											);
											return;
										}
									}
									updateStatus(status.id, { isRestricted: !status.isRestricted });
								}}
							>
								{status.isRestricted ? 'Sim' : 'Não'}
							</button>
						</td>
						<td class="col-tone">
							<BadgeSelect
								value={status.tone}
								options={STATUS_TONES.map((tone) => ({
									value: tone,
									label: TONE_LABELS[tone as StatusTone]
								}))}
								variant="tone"
								ariaLabel={`Tom visual de ${status.name}`}
								disabled={section.saving || loadFailed}
								onChange={(v) => commitCellSelect(status, 'tone', v as StatusTone)}
							/>
						</td>
						<td class="col-actions">
							<button
								class="icon-btn"
								type="button"
								aria-label={status.isActive ? 'Inativar status' : 'Ativar status'}
								title={status.isActive
									? status.isCore
										? 'Vital não inativa'
										: 'Inativar status'
									: 'Ativar status'}
								disabled={section.saving || loadFailed || !canToggleInactive(status)}
								onclick={() => toggleActive(status)}
							>
								<Icon iconName={status.isActive ? 'block' : 'check'} iconSize="sm" />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</SettingsCard>

<style>
	.status-groups-legend {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		font-size: 11px;
	}
	.legend-item {
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-weight: 700;
		cursor: help;
		text-decoration: underline dotted 1px;
		text-underline-offset: 2px;
		transition: filter var(--transition-default);
	}
	.legend-item:hover {
		filter: brightness(0.92);
	}
	.legend-identidade {
		background: #e0f2fe;
		color: #0c4a6e;
	}
	.legend-visibilidade {
		background: #fef9c3;
		color: #713f12;
	}
	.legend-ciclo {
		background: #dcfce7;
		color: #14532d;
	}
	.status-toolbar {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}
	.status-filters {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		flex-wrap: wrap;
	}
	.filter-label {
		font: var(--label);
		font-size: 12px;
		color: var(--text-color-secondary);
		margin-right: 2px;
	}
	.filter-pill {
		padding: 4px 10px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--text-color-secondary);
		font-size: 12px;
		cursor: pointer;
		transition:
			background-color var(--transition-default),
			border-color var(--transition-default),
			color var(--transition-default);
	}
	.filter-pill.selected {
		border-color: var(--secondary-color);
		color: var(--secondary-color);
		font-weight: 700;
	}
	.filter-select {
		padding: 4px 8px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font-size: 12px;
		background: var(--white);
	}
	.filter-select.filter-pill {
		padding: 4px 10px;
		cursor: pointer;
	}
	.filter-select.filter-pill.selected {
		border-color: var(--secondary-color);
		color: var(--secondary-color);
		font-weight: 700;
	}
	.status-icon.is-core {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		margin-right: var(--spacing-sm);
		color: var(--tone-family);
		flex-shrink: 0;
	}
	.filter-pill:focus-visible,
	.tipo-pill:focus-visible,
	.clear-filters:focus-visible,
	.cell-button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}
	.tipo-pills {
		display: inline-flex;
		flex-direction: column;
		align-items: stretch;
		gap: 2px;
	}
	.tipo-pill {
		padding: 2px 8px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--text-color-secondary);
		font-size: 12px;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color var(--transition-default),
			border-color var(--transition-default),
			color var(--transition-default),
			transform 120ms ease;
	}
	.tipo-pill.on {
		border-color: var(--secondary-color);
		background-color: var(--secondary-color);
		color: var(--on-primary);
		font-weight: 700;
	}
	.tipo-pill:active:not(:disabled) {
		transform: scale(0.92);
	}
	.tipo-pill:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.clear-filters {
		border: none;
		background: none;
		padding: 4px;
		color: var(--secondary-color);
		font-size: 12px;
		font-weight: 700;
		text-decoration: underline;
		cursor: pointer;
	}
	.status-error {
		margin: 0;
		font-size: 13px;
		color: var(--status-red);
	}
	.status-table {
		width: 100%;
		max-width: 100%;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		display: block;
	}
	table {
		width: 100%;
		min-width: 960px;
		border-collapse: collapse;
		table-layout: fixed;
	}
	th {
		padding: var(--spacing-sm) var(--spacing-sm);
		text-align: left;
		background: var(--background-color);
		color: var(--text-color-primary);
		font: var(--label);
		font-size: 11px;
		white-space: nowrap;
		border-bottom: var(--border-default);
	}
	td {
		padding: var(--spacing-sm) var(--spacing-sm);
		border-bottom: var(--border-default);
		color: var(--text-color-primary);
		font-size: 13px;
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	.col-name {
		width: 190px;
	}
	.col-public {
		width: 95px;
		text-align: center;
	}
	.col-terminal {
		width: 85px;
		text-align: center;
	}
	.col-mode {
		width: 110px;
		text-align: center;
	}
	.col-restricted {
		width: 85px;
		text-align: center;
	}
	.col-tone {
		width: 120px;
		text-align: center;
	}
	.col-actions {
		width: 52px;
		text-align: end;
		white-space: nowrap;
	}
	.is-core {
		background: color-mix(in srgb, var(--tint) 40%, transparent);
	}
	.cell-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 2px 4px;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		transition:
			background-color var(--transition-default),
			border-color var(--transition-default);
	}
	.cell-button:hover:not(:disabled) {
		border-color: var(--border-color);
		background-color: var(--background-color);
	}
	.cell-button:disabled {
		cursor: default;
	}
	.cell-button .cell-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.name-button {
		max-width: 180px;
	}
	.cell-select {
		box-sizing: border-box;
		padding: 4px 8px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font-size: 13px;
		color: var(--text-color-primary);
		background-color: var(--white);
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
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		margin-right: var(--spacing-sm);
		flex-shrink: 0;
	}
	.status-dot::after {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--tone-family);
	}
	.core-lock {
		margin-right: 4px;
		color: var(--status-warning);
	}
	.visibility-badge {
		display: inline-block;
		padding: 2px var(--spacing-sm);
		border-radius: var(--radius-sm);
		background-color: var(--white-gray);
		color: var(--text-color-primary);
		font-size: 12px;
		white-space: nowrap;
	}
	.mode-badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: var(--white-gray);
		font-size: 11px;
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
		color: var(--text-color-primary);
	}
	.edit-input.invalid {
		border-color: var(--status-error);
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
	@media (prefers-reduced-motion: reduce) {
		.filter-pill,
		.tipo-pill,
		.cell-button {
			transition: none;
		}
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
</style>
