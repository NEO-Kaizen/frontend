<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import ToggleButton from '$lib/components/ToggleButton.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { isPortalConfigLoadBlocked } from '$lib/config/portal-config-load';
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
	import { notifyError, notifySectionSave } from '$lib/utils/feedback';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<StatusesSection>(
		{ statuses: page.data.portalConfig.statuses },
		{ statuses: DEFAULT_PORTAL_CONFIG.statuses },
		(draft) => saveStatuses({ statuses: draft.statuses })
	);

	// Leitura autoritativa falhou: o draft pode ser o fallback local — bloqueia
	// edição e salvamento até a revalidação.
	const loadFailed = $derived(isPortalConfigLoadBlocked(page.data));

	// Animações de filtragem respeitam o SO: com movimento reduzido, durações
	// zeradas fazem o Svelte pular a transição sem caminho de código separado.
	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const ROW_TRANSITION_MS = prefersReducedMotion ? 0 : 220;

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

	// Linha nova ainda sem nome no draft: bloqueia "Adicionar status" para não
	// acumular registros vazios.
	const hasPendingStatus = $derived(
		section.draft.statuses.some((status) => status.name.trim() === '')
	);

	// Validação da linha em edição (Card 6) — nome obrigatório e único.
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
		// Novo status herda os filtros booleanos ativos para continuar visível
		// na lista filtrada; com filtros em "Todas", mantém os defaults.
		setStatuses([
			{
				id: nextId(section.draft.statuses),
				name: '',
				visibility: 'PUBLIC',
				closesRequest: closesFilter === 'all' ? false : closesFilter === 'true',
				isTriageExit: triageExitFilter === 'all' ? false : triageExitFilter === 'true',
				tone: 'info',
				isActive: true
			},
			...section.draft.statuses
		]);
	}

	function updateStatus(
		id: number,
		patch: Partial<
			Pick<
				PortalStatus,
				'name' | 'visibility' | 'closesRequest' | 'isTriageExit' | 'tone' | 'isActive'
			>
		>
	) {
		setStatuses(replaceById<PortalStatus>(section.draft.statuses, id, patch));
	}

	// Foca o controle assim que a célula entra em edição.
	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	// Abre o menu nativo do select no mesmo gesto do clique: o badge "funciona
	// como" o select em um clique só. Sem suporte ou sem ativação, cai no
	// foco (comportamento atual de dois cliques) em vez de quebrar.
	// Dispensar o menu sem escolher volta ao badge: clique fora fecha via
	// `dismissOnOutside`; clicar no próprio select (menu já dispensado) fecha
	// via `dismissOnSelf` — o nativo não emite evento ao clicar na opção atual.
	// O cleanup do attach remove os listeners ao desmontar o editor.
	function openSelectPicker(node: HTMLElement) {
		node.focus();
		let menuOpened = false;
		try {
			(node as HTMLSelectElement).showPicker?.();
			menuOpened = true;
		} catch {
			// ignore — foco já aplicado acima
		}
		const dismissOnOutside = (event: PointerEvent) => {
			if (event.target instanceof Node && !node.contains(event.target)) {
				closeCellEditor();
			}
		};
		// Só arma o auto-fechamento quando o menu abriu sozinho: no fallback
		// (usuário abre o menu clicando), ele mataria o menu recém-aberto.
		const dismissOnSelf = () => closeCellEditor();
		window.addEventListener('pointerdown', dismissOnOutside);
		if (menuOpened) {
			node.addEventListener('pointerdown', dismissOnSelf);
		}
		return () => {
			window.removeEventListener('pointerdown', dismissOnOutside);
			node.removeEventListener('pointerdown', dismissOnSelf);
		};
	}

	// Edição por célula (clique no valor): `null` = nenhuma célula em edição.
	// Diferente do modo de edição por linha, apenas uma célula abre por vez e
	// selects nativos confirmam na escolha (sem popover customizado preso no scroll).
	type EditableStatusField = 'name' | 'visibility' | 'tone';
	let editingCell = $state<{ id: number; field: EditableStatusField } | null>(null);
	let editingName = $state('');

	// Só marca o nome como inválido depois que o usuário tenta confirmá-lo.
	let nameError = $state(false);
	const nameInvalid = $derived(
		nameError && editingCell?.field === 'name' && !isValidStatusName(editingName)
	);

	// Filtros de exibição (somente visão, nunca mutam o draft): inativos
	// continuam no draft e podem ser reativados; booleanos filtram por valor.
	type BooleanFilter = 'all' | 'true' | 'false';
	let showInactive = $state(false);
	let closesFilter = $state<BooleanFilter>('all');
	let triageExitFilter = $state<BooleanFilter>('all');
	const visibleStatuses = $derived(
		section.draft.statuses.filter(
			(status) =>
				(showInactive || status.isActive) &&
				(closesFilter === 'all' || String(status.closesRequest) === closesFilter) &&
				(triageExitFilter === 'all' || String(status.isTriageExit) === triageExitFilter)
		)
	);
	const inactiveCount = $derived(section.draft.statuses.filter((s) => !s.isActive).length);
	const hasActiveFilters = $derived(closesFilter !== 'all' || triageExitFilter !== 'all');

	function clearFilters() {
		closesFilter = 'all';
		triageExitFilter = 'all';
	}

	const BOOLEAN_FILTER_LABELS: Record<BooleanFilter, string> = {
		all: 'Todas',
		true: 'Sim',
		false: 'Não'
	};

	// Pílulas de filtro alternam Todas → Sim → Não → Todas.
	function cycleBooleanFilter(which: 'closes' | 'triageExit') {
		const next = (current: BooleanFilter): BooleanFilter =>
			current === 'all' ? 'true' : current === 'true' ? 'false' : 'all';
		if (which === 'closes') {
			closesFilter = next(closesFilter);
		} else {
			triageExitFilter = next(triageExitFilter);
		}
	}

	// Impede inativar o último status ativo.
	function canToggleInactive(status: PortalStatus): boolean {
		if (!status.isActive) return true;
		return section.draft.statuses.filter((item) => item.isActive).length > 1;
	}

	// Ativa/inativa é a única ação de "saída" — não há exclusão de item salvo.
	function toggleActive(status: PortalStatus) {
		updateStatus(status.id, { isActive: !status.isActive });
	}

	// Pop simétrico ao alternar Encerra/Saída (liga e desliga): a Web Animations
	// API não depende de classe adicionada/removida, então o movimento é igual
	// nas duas direções. Com movimento reduzido, pula direto (só o glide de cor).
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
		const added = section.draft.statuses[0];
		if (!added) return;
		// Novo status abre direto no editor de nome — e como herda os filtros
		// ativos (ver addStatus), permanece visível na lista filtrada.
		editingCell = { id: added.id, field: 'name' };
		editingName = added.name;
		nameError = false;
	}

	function openCellEditor(status: PortalStatus, field: EditableStatusField) {
		if (section.saving || loadFailed) return;
		editingCell = { id: status.id, field };
		nameError = false;
		if (field === 'name') {
			editingName = status.name;
		}
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
		updateStatus(status.id, { name: editingName.trim() });
		closeCellEditor();
	}

	function cancelNameEdit(status: PortalStatus) {
		// Cancelar um status recém-adicionado (ainda sem nome) descarta a linha;
		// itens já salvos nunca são excluídos (apenas ativados/inativados).
		if (status.name.trim() === '') {
			setStatuses(removeById(section.draft.statuses, status.id));
		}
		closeCellEditor();
	}

	// Selects nativos confirmam na escolha: atualizam o draft (seção fica dirty)
	// e fecham o editor. O salvamento continua na ação da seção.
	function commitCellSelect(
		status: PortalStatus,
		field: Exclude<EditableStatusField, 'name'>,
		value: string
	) {
		switch (field) {
			case 'visibility':
				updateStatus(status.id, { visibility: value as StatusVisibility });
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
	title="6. Status"
	description="Configure os status do ciclo de vida das solicitações."
>
	{#snippet titleAddon()}
		<InfoTip
			label="Como editar os status"
			text="Clique nos valores para editar, ou ligue e desligue Encerra e Saída na coluna Tipo. As alterações ficam pendentes até você clicar em Salvar."
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
			class:selected={closesFilter !== 'all'}
			aria-label="Filtro de encerramento: {BOOLEAN_FILTER_LABELS[
				closesFilter
			]}. Clique para alternar."
			onclick={() => cycleBooleanFilter('closes')}
		>
			Encerramento: {BOOLEAN_FILTER_LABELS[closesFilter]}
		</button>
		<button
			type="button"
			class="filter-pill"
			class:selected={triageExitFilter !== 'all'}
			aria-label="Filtro de saída de triagem: {BOOLEAN_FILTER_LABELS[
				triageExitFilter
			]}. Clique para alternar."
			onclick={() => cycleBooleanFilter('triageExit')}
		>
			Saída: {BOOLEAN_FILTER_LABELS[triageExitFilter]}
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

	<div class="status-table" role="region" aria-label="Tabela de status">
		<table>
			<thead>
				<tr>
					<th scope="col" class="col-name">Nome</th>
					<th scope="col" class="col-visibility">Visível em</th>
					<th scope="col" class="col-tipo">Tipo</th>
					<th scope="col" class="col-tone">Tom visual</th>
					<th scope="col" class="col-actions">Ativo</th>
				</tr>
			</thead>
			<tbody>
				{#each visibleStatuses as status (status.id)}
					<tr
						class="tone-{status.tone}"
						in:fade={{ duration: ROW_TRANSITION_MS }}
						out:fade={{ duration: ROW_TRANSITION_MS }}
						animate:flip={{ duration: ROW_TRANSITION_MS }}
					>
						<td class="col-name">
							<span class="name-field">
								<span class="status-dot" aria-hidden="true"></span>
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
										disabled={section.saving || loadFailed}
										onclick={() => openCellEditor(status, 'name')}
									>
										<span class="cell-text">{status.name}</span>
									</button>
								{/if}
							</span>
						</td>
						<td class="col-visibility">
							{#if editingCell?.id === status.id && editingCell.field === 'visibility'}
								<select
									class="cell-select"
									aria-label="Visibilidade de {status.name}"
									value={status.visibility}
									{@attach openSelectPicker}
									onchange={(event) =>
										commitCellSelect(status, 'visibility', event.currentTarget.value)}
									onkeydown={(event) => {
										if (event.key === 'Escape') closeCellEditor();
									}}
									onblur={() => closeCellEditor()}
								>
									{#each VISIBILITY_OPTIONS as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							{:else}
								<button
									type="button"
									class="cell-button"
									aria-label="Alterar visibilidade de {status.name}"
									disabled={section.saving || loadFailed}
									onclick={() => openCellEditor(status, 'visibility')}
								>
									<span class="visibility-badge">
										{status.visibility === 'PUBLIC' ? 'Público' : 'Interno'}
									</span>
								</button>
							{/if}
						</td>
						<td class="col-tipo">
							<span class="tipo-pills" role="group" aria-label="Tipo de {status.name}">
								<button
									type="button"
									class="tipo-pill"
									class:on={status.closesRequest}
									aria-pressed={status.closesRequest}
									aria-label="Encerramento de {status.name}"
									disabled={section.saving || loadFailed}
									onclick={(event) => {
										popToggle(event);
										updateStatus(status.id, { closesRequest: !status.closesRequest });
									}}
								>
									Encerra
								</button>
								<button
									type="button"
									class="tipo-pill"
									class:on={status.isTriageExit}
									aria-pressed={status.isTriageExit}
									aria-label="Saída de triagem de {status.name}"
									disabled={section.saving || loadFailed}
									onclick={(event) => {
										popToggle(event);
										updateStatus(status.id, { isTriageExit: !status.isTriageExit });
									}}
								>
									Saída
								</button>
							</span>
						</td>
						<td class="col-tone">
							{#if editingCell?.id === status.id && editingCell.field === 'tone'}
								<select
									class="cell-select"
									aria-label="Tom visual de {status.name}"
									value={status.tone}
									{@attach openSelectPicker}
									onchange={(event) => commitCellSelect(status, 'tone', event.currentTarget.value)}
									onkeydown={(event) => {
										if (event.key === 'Escape') closeCellEditor();
									}}
									onblur={() => closeCellEditor()}
								>
									{#each STATUS_TONES as tone (tone)}
										<option value={tone}>{TONE_LABELS[tone]}</option>
									{/each}
								</select>
							{:else}
								<button
									type="button"
									class="cell-button"
									aria-label="Alterar tom visual de {status.name}"
									disabled={section.saving || loadFailed}
									onclick={() => openCellEditor(status, 'tone')}
								>
									<span class="tone-badge">
										<span class="tone-dot" aria-hidden="true"></span>
										{TONE_LABELS[status.tone]}
									</span>
								</button>
							{/if}
						</td>
						<td class="col-actions">
							<button
								class="icon-btn"
								type="button"
								aria-label={status.isActive ? 'Inativar status' : 'Ativar status'}
								title={status.isActive ? 'Inativar status' : 'Ativar status'}
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
		width: max-content;
		max-width: 100%;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow-x: auto;
	}

	/* Larguras fixas em px: a tabela nunca remedeia colunas ao filtrar
	   (sem saltos), nunca estica além do conteúdo e nunca comprime cabeçalhos
	   (sem colisão). Abaixo dessa largura, o container rola horizontalmente. */
	table {
		width: 632px;
		border-collapse: collapse;
		table-layout: fixed;
	}

	th {
		padding: var(--spacing-sm) var(--spacing-sm);
		text-align: left;
		background: var(--background-color);
		color: var(--text-color-primary);
		font: var(--label);
		font-size: 12px;
		white-space: nowrap;
		border-bottom: var(--border-default);
	}

	td {
		padding: var(--spacing-sm) var(--spacing-sm);
		border-bottom: var(--border-default);
		color: var(--text-color-primary);
		font-size: 14px;
		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.col-name {
		width: 240px;
	}

	.col-visibility {
		width: 100px;
		text-align: center;
	}

	.col-tipo {
		width: 100px;
		text-align: center;
	}

	.col-tone {
		width: 140px;
		text-align: center;
	}

	.col-actions {
		width: 52px;
		text-align: end;
		white-space: nowrap;
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
		max-width: 320px;
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
		color: var(--text-color-primary);
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
