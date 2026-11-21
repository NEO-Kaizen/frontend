<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ToggleButton from '$lib/components/ToggleButton.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { isPortalConfigLoadBlocked } from '$lib/config/portal-config-load';
	import { saveCategories } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import type { CategoriesSection, PortalCategory } from '$lib/types/portal-config';
	import { nextId, removeById, replaceById } from '$lib/utils/lists';
	import {
		areCategoryNamesUnique,
		hasActiveCategory,
		isValidCategoryDescription,
		isValidCategoryName,
		MAX_CATEGORIES,
		MAX_CATEGORY_DESCRIPTION_LENGTH,
		MAX_CATEGORY_NAME_LENGTH
	} from '$lib/utils/validations';
	import { notifyError, notifySectionSave } from '$lib/utils/feedback';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<CategoriesSection>(
		{ categories: page.data.portalConfig.categories },
		{ categories: DEFAULT_PORTAL_CONFIG.categories },
		(draft) => saveCategories({ categories: draft.categories })
	);

	// Leitura autoritativa falhou: o draft pode ser o fallback local — bloqueia
	// edição e salvamento até a revalidação.
	const loadFailed = $derived(isPortalConfigLoadBlocked(page.data));

	// Erro global da lista (Card 5) — nome vazio, duplicado, nenhuma ativa ou
	// limite de itens. Sem erro, fica null e o campo não bloqueia o salvamento.
	const categoriesError: string | null = $derived.by(() => {
		const categories = section.draft.categories;

		if (categories.length === 0) return 'Adicione ao menos uma categoria.';
		if (categories.length > MAX_CATEGORIES) return `O limite é de ${MAX_CATEGORIES} categorias.`;
		if (
			categories.some(
				(category) =>
					!isValidCategoryName(category.name) || !isValidCategoryDescription(category.description)
			)
		) {
			return 'Preencha nome (até 40 caracteres) e descrição (até 200 caracteres) de cada categoria.';
		}
		if (!areCategoryNamesUnique(categories)) return 'Nomes de categoria não podem se repetir.';
		if (!hasActiveCategory(categories)) return 'Mantenha ao menos uma categoria ativa.';
		return null;
	});

	const invalid = $derived(categoriesError !== null);

	// Linha nova ainda sem nome no draft: bloqueia "Adicionar categoria" para
	// não acumular registros vazios.
	const hasPendingCategory = $derived(
		section.draft.categories.some((category) => category.name.trim() === '')
	);

	// Validações por célula (Card 5) — nome obrigatório/único e descrição
	// dentro do limite. Cada célula reporta apenas o próprio erro.
	function categoryNameError(name: string, id: number): string | null {
		if (!isValidCategoryName(name)) return 'Preencha o nome da categoria (até 40 caracteres).';

		const duplicated = section.draft.categories.some(
			(category) =>
				category.id !== id && category.name.trim().toLowerCase() === name.trim().toLowerCase()
		);
		if (duplicated) return 'Nomes de categoria não podem se repetir.';

		return null;
	}

	function categoryDescriptionError(description: string): string | null {
		if (!isValidCategoryDescription(description)) {
			return 'A descrição da categoria deve ter até 200 caracteres.';
		}

		return null;
	}

	function setCategories(categories: PortalCategory[]) {
		section.draft = { categories };
	}

	async function handleSave() {
		if (loadFailed) return;
		notifySectionSave(await section.save());
	}

	function addCategory() {
		setCategories([
			{ id: nextId(section.draft.categories), name: '', description: '', isActive: true },
			...section.draft.categories
		]);
	}

	function updateCategory(
		id: number,
		patch: Partial<Pick<PortalCategory, 'name' | 'description' | 'isActive'>>
	) {
		setCategories(replaceById<PortalCategory>(section.draft.categories, id, patch));
	}

	function removeCategory(id: number) {
		setCategories(removeById(section.draft.categories, id));
	}

	function reorderCategory(fromId: number, toId: number) {
		const fromIndex = section.draft.categories.findIndex((category) => category.id === fromId);
		const toIndex = section.draft.categories.findIndex((category) => category.id === toId);
		if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

		const reordered = [...section.draft.categories];
		const [moved] = reordered.splice(fromIndex, 1);
		reordered.splice(toIndex, 0, moved);
		setCategories(reordered);
	}

	// Foca o input assim que a célula entra em edição.
	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}

	type EditableCategoryField = 'name' | 'description';

	// Célula em edição (nome ou descrição); `null` = nenhuma.
	let editingCell = $state<{ id: number; field: EditableCategoryField } | null>(null);
	let editingName = $state('');
	let editingDescription = $state('');

	// Só marca a célula como inválida depois que o usuário tenta confirmá-la.
	let nameError = $state(false);
	let descriptionError = $state(false);
	const nameInvalid = $derived(
		nameError && editingCell?.field === 'name' && !isValidCategoryName(editingName)
	);
	const descriptionInvalid = $derived(
		descriptionError &&
			editingCell?.field === 'description' &&
			!isValidCategoryDescription(editingDescription)
	);

	function handleAdd() {
		addCategory();
		const added = section.draft.categories[0];
		if (!added) return;
		editingCell = { id: added.id, field: 'name' };
		editingName = added.name;
		nameError = false;
	}

	function openCellEditor(category: PortalCategory, field: EditableCategoryField) {
		if (section.saving || loadFailed) return;
		editingCell = { id: category.id, field };
		nameError = false;
		descriptionError = false;
		if (field === 'name') {
			editingName = category.name;
		} else {
			editingDescription = category.description;
		}
	}

	function closeCellEditor() {
		editingCell = null;
		nameError = false;
		descriptionError = false;
	}

	function commitNameEdit(category: PortalCategory) {
		const error = categoryNameError(editingName, category.id);
		if (error) {
			nameError = true;
			notifyError(error);
			return;
		}
		updateCategory(category.id, { name: editingName.trim() });
		closeCellEditor();
	}

	function commitDescriptionEdit(category: PortalCategory) {
		const error = categoryDescriptionError(editingDescription);
		if (error) {
			descriptionError = true;
			notifyError(error);
			return;
		}
		updateCategory(category.id, { description: editingDescription });
		closeCellEditor();
	}

	function cancelEdit(category: PortalCategory) {
		// Cancelar uma categoria recém-adicionada (ainda sem nome) remove a linha.
		if (category.name.trim() === '') {
			removeCategory(category.id);
		}
		closeCellEditor();
	}

	// Impede desativar a última categoria ativa.
	function canToggleInactive(category: PortalCategory): boolean {
		if (!category.isActive) return true;
		const activeCategories = section.draft.categories.filter((item) => item.isActive);
		return activeCategories.length > 1;
	}

	// Categoria arrastada para reordenação (Card 5); `null` = nenhuma.
	let draggingId = $state<number | null>(null);
	let dropTargetId = $state<number | null>(null);

	// Filtro de exibição: inativos continuam no draft e podem ser reativados.
	let showInactive = $state(false);
	const visibleCategories = $derived(
		section.draft.categories.filter((category) => showInactive || category.isActive)
	);
	const inactiveCount = $derived(section.draft.categories.filter((c) => !c.isActive).length);

	// Ativa/inativa é a única ação de "saída" — não há exclusão de item salvo.
	function toggleActive(category: PortalCategory) {
		updateCategory(category.id, { isActive: !category.isActive });
	}

	function handleDragStart(event: DragEvent, id: number): void {
		draggingId = id;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', String(id));
		}
	}

	function handleDragEnd(): void {
		draggingId = null;
		dropTargetId = null;
	}

	function handleDrop(target: PortalCategory): void {
		if (draggingId !== null) {
			reorderCategory(draggingId, target.id);
		}
		handleDragEnd();
	}

	// Fallback de teclado para a reordenação (acessibilidade): setas movem a
	// categoria para a posição do vizinho, na direção indicada.
	function handleMoveByKeyboard(id: number, delta: -1 | 1): void {
		const categories = section.draft.categories;
		const index = categories.findIndex((category) => category.id === id);
		const neighbor = categories[index + delta];
		if (neighbor) {
			reorderCategory(id, neighbor.id);
		}
	}
</script>

<SettingsCard
	iconName="category"
	title="5. Categorias da demanda"
	description="Gerencie as categorias que alimentam o select do formulário de solicitação."
>
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

	<div class="categories-body">
		<div class="categories-toolbar">
			<Button
				variant="secondary"
				disabled={section.saving ||
					loadFailed ||
					section.draft.categories.length >= MAX_CATEGORIES ||
					hasPendingCategory}
				onclick={handleAdd}
			>
				<Icon iconName="addCircle" iconSize="sm" />
				<span>Adicionar categoria</span>
			</Button>

			<ToggleButton
				pressed={showInactive}
				label="Mostrar inativas"
				pressedLabel="Ocultar inativas"
				count={inactiveCount}
				onclick={() => (showInactive = !showInactive)}
			/>
		</div>

		{#if categoriesError && !editingCell}
			<p class="categories-error" role="alert">{categoriesError}</p>
		{/if}

		<div class="categories-table">
			<table>
				<thead>
					<tr>
						<th scope="col" class="col-name">Nome da categoria</th>
						<th scope="col" class="col-description">Descrição</th>
						<th scope="col" class="col-status">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each visibleCategories as category (category.id)}
						<tr
							class:is-drag-source={draggingId === category.id}
							class:is-drag-target={dropTargetId === category.id}
							ondragover={(event) => {
								if (draggingId === null) return;
								event.preventDefault();
								if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
								dropTargetId = category.id;
							}}
							ondragleave={() => {
								if (dropTargetId === category.id) dropTargetId = null;
							}}
							ondrop={(event) => {
								event.preventDefault();
								handleDrop(category);
							}}
						>
							<td class="col-name">
								<span class="name-field">
									<span
										class="drag-handle"
										role="button"
										tabindex="0"
										title="Arraste para reordenar (ou use as setas para cima/baixo)"
										aria-label="Reordenar categoria"
										draggable={!section.saving &&
											!loadFailed &&
											!(editingCell && editingCell.id === category.id)}
										ondragstart={(event) => handleDragStart(event, category.id)}
										ondragend={handleDragEnd}
										onkeydown={(event) => {
											if (editingCell && editingCell.id === category.id) return;
											if (event.key === 'ArrowUp') {
												event.preventDefault();
												handleMoveByKeyboard(category.id, -1);
											} else if (event.key === 'ArrowDown') {
												event.preventDefault();
												handleMoveByKeyboard(category.id, 1);
											}
										}}
									>
										<Icon iconName="dragIndicator" iconSize="sm" />
									</span>
									{#if editingCell?.id === category.id && editingCell.field === 'name'}
										<input
											class="edit-input"
											class:invalid={nameInvalid}
											type="text"
											maxlength={MAX_CATEGORY_NAME_LENGTH}
											aria-label="Nome da categoria"
											aria-invalid={nameInvalid}
											{@attach focusOnMount}
											bind:value={editingName}
											onkeydown={(event) => {
												if (event.key === 'Enter') commitNameEdit(category);
												else if (event.key === 'Escape') cancelEdit(category);
											}}
											onblur={() => commitNameEdit(category)}
										/>
									{:else}
										<button
											type="button"
											class="cell-button name-button"
											aria-label="Editar nome de {category.name}"
											disabled={section.saving || loadFailed}
											onclick={() => openCellEditor(category, 'name')}
										>
											<span class="cell-text">{category.name}</span>
										</button>
									{/if}
								</span>
							</td>
							<td class="col-description">
								{#if editingCell?.id === category.id && editingCell.field === 'description'}
									<input
										class="edit-input"
										class:invalid={descriptionInvalid}
										type="text"
										maxlength={MAX_CATEGORY_DESCRIPTION_LENGTH}
										aria-label="Descrição da categoria"
										aria-invalid={descriptionInvalid}
										{@attach focusOnMount}
										bind:value={editingDescription}
										onkeydown={(event) => {
											if (event.key === 'Enter') commitDescriptionEdit(category);
											else if (event.key === 'Escape') cancelEdit(category);
										}}
										onblur={() => commitDescriptionEdit(category)}
									/>
								{:else}
									<button
										type="button"
										class="cell-button description-button"
										aria-label="Editar descrição de {category.name}"
										disabled={section.saving || loadFailed}
										onclick={() => openCellEditor(category, 'description')}
									>
										<span class="cell-text">{category.description || '—'}</span>
									</button>
									{#if category.description}
										<span class="description-tooltip" aria-hidden="true"
											>{category.description}</span
										>
									{/if}
								{/if}
							</td>
							<td class="col-status">
								<button
									type="button"
									class="badge badge-toggle {category.isActive ? 'badge-active' : 'badge-inactive'}"
									aria-pressed={category.isActive}
									aria-label={category.isActive ? 'Inativar categoria' : 'Ativar categoria'}
									title={category.isActive ? 'Inativar categoria' : 'Ativar categoria'}
									disabled={section.saving || loadFailed || !canToggleInactive(category)}
									onclick={() => toggleActive(category)}
								>
									{category.isActive ? 'Ativa' : 'Inativa'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</SettingsCard>

<style>
	.categories-toolbar {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.categories-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.categories-table {
		width: 100%;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	/* O tooltip da descrição precisa escapar do corte do texto; os cantos
	   arredondados são reaplicados nas células de extremidade. */
	thead tr:first-child th:first-child {
		border-top-left-radius: var(--radius-sm);
	}

	thead tr:first-child th:last-child {
		border-top-right-radius: var(--radius-sm);
	}

	tbody tr:last-child td:first-child {
		border-bottom-left-radius: var(--radius-sm);
	}

	tbody tr:last-child td:last-child {
		border-bottom-right-radius: var(--radius-sm);
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
		color: var(--black);
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

	th.col-description {
		text-align: center;
	}

	.col-name {
		width: 32%;
	}

	.col-description {
		position: relative;
		width: 52%;
		max-width: 0;
		overflow: visible;
		text-align: center;
	}

	.description-tooltip {
		position: absolute;
		top: calc(100% + 6px);
		left: 50%;
		transform: translate(-50%, -4px);
		z-index: 20;
		width: max-content;
		max-width: 280px;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background-color: var(--rich-black);
		color: var(--on-dark);
		font: var(--paragrafo);
		font-size: 13px;
		line-height: 1.4;
		text-align: left;
		white-space: normal;
		opacity: 0;
		pointer-events: none;
		transition: var(--transition-default);
	}

	.description-button:hover + .description-tooltip {
		opacity: 1;
		transform: translate(-50%, 0);
	}

	.col-status {
		width: 16%;
		text-align: center;
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

	.drag-handle {
		display: inline-flex;
		align-items: center;
		margin-right: var(--spacing-sm);
		vertical-align: middle;
		color: var(--gray);
		cursor: grab;
		flex-shrink: 0;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.drag-handle:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.is-drag-source {
		opacity: 0.4;
	}

	.is-drag-target td {
		box-shadow: inset 0 2px 0 0 var(--secondary-color);
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

	.cell-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		max-width: 100%;
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
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name-button {
		flex: 1;
		min-width: 0;
		max-width: 100%;
	}

	.description-button {
		display: inline-flex;
		width: 100%;
		min-width: 0;
		max-width: 100%;
	}

	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 600;
	}

	.badge-active {
		background-color: var(--status-green-bg);
		color: var(--status-green);
	}

	.badge-inactive {
		background-color: var(--background-color);
		color: var(--gray);
	}

	.badge-toggle {
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			background-color var(--transition-default),
			border-color var(--transition-default),
			transform 120ms ease;
	}

	.badge-toggle:hover:not(:disabled) {
		filter: brightness(0.98);
		border-color: currentColor;
	}

	.badge-toggle:active:not(:disabled) {
		transform: scale(0.96);
	}

	.badge-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.categories-error {
		margin: 0;
		font-size: 13px;
		color: var(--status-red);
	}
</style>
