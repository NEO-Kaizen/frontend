<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
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
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<CategoriesSection>(
		{ categories: page.data.portalConfig.categories },
		{ categories: DEFAULT_PORTAL_CONFIG.categories },
		(draft) => saveCategories({ categories: draft.categories })
	);

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

	function setCategories(categories: PortalCategory[]) {
		section.draft = { categories };
		section.clearFeedback();
	}

	function addCategory() {
		setCategories([
			...section.draft.categories,
			{ id: nextId(section.draft.categories), name: '', description: '', isActive: true }
		]);
	}

	function updateCategory(
		id: number,
		patch: Partial<Pick<PortalCategory, 'name' | 'description' | 'isActive'>>
	) {
		setCategories(replaceById<PortalCategory>(section.draft.categories, id, patch));
	}

	function toggleCategory(id: number) {
		const current = section.draft.categories.find((category) => category.id === id);
		updateCategory(id, { isActive: !current?.isActive });
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

	// Categoria em edição (nome/descrição locais do input); `null` = nenhuma.
	let editing = $state<{ id: number; name: string; description: string } | null>(null);

	function handleAdd() {
		addCategory();
		const categories = section.draft.categories;
		const added = categories[categories.length - 1];
		editing = added ? { id: added.id, name: added.name, description: added.description } : null;
	}

	function handleEdit(category: PortalCategory) {
		editing = { id: category.id, name: category.name, description: category.description };
	}

	function handleSaveEdit() {
		if (!editing) return;
		updateCategory(editing.id, { name: editing.name, description: editing.description });
		editing = null;
	}

	function handleCancelEdit(category: PortalCategory) {
		// Cancelar uma categoria recém-adicionada (ainda sem nome) remove a linha.
		if (category.name.trim() === '') {
			removeCategory(category.id);
		}
		editing = null;
	}

	// Impede desativar a última categoria ativa.
	function canToggleInactive(category: PortalCategory): boolean {
		if (!category.isActive) return true;
		const activeCategories = section.draft.categories.filter((item) => item.isActive);
		return activeCategories.length > 1;
	}

	// Só permite remover se sobrar ao menos uma categoria ativa.
	function canRemoveCategory(category: PortalCategory): boolean {
		const categories = section.draft.categories;
		if (categories.length === 1) return false;
		if (!category.isActive) return true;
		return categories.filter((item) => item.isActive).length > 1;
	}

	// Categoria arrastada para reordenação (Card 5); `null` = nenhuma.
	let draggingId = $state<number | null>(null);
	let dropTargetId = $state<number | null>(null);

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
			{invalid}
			feedback={section.feedback}
			onSave={() => section.save()}
			onCancel={() => section.reset()}
			onRestoreDefaults={() => section.restoreDefaults()}
		/>
	{/snippet}

	<div class="categories-body">
		<Button
			variant="secondary"
			disabled={section.saving || section.draft.categories.length >= MAX_CATEGORIES}
			onclick={handleAdd}
		>
			<Icon iconName="addCircle" iconSize="sm" />
			Adicionar categoria
		</Button>

		{#if categoriesError}
			<p class="categories-error" role="alert">{categoriesError}</p>
		{/if}

		<div class="categories-table">
			<table>
				<thead>
					<tr>
						<th scope="col" class="col-name">Nome da categoria</th>
						<th scope="col" class="col-description">Descrição</th>
						<th scope="col" class="col-status">Status</th>
						<th scope="col" class="col-actions">Ações</th>
					</tr>
				</thead>
				<tbody>
					{#each section.draft.categories as category (category.id)}
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
										draggable={!section.saving && !(editing && editing.id === category.id)}
										ondragstart={(event) => handleDragStart(event, category.id)}
										ondragend={handleDragEnd}
										onkeydown={(event) => {
											if (editing && editing.id === category.id) return;
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
									{#if editing && editing.id === category.id}
										<input
											class="edit-input"
											type="text"
											maxlength={MAX_CATEGORY_NAME_LENGTH}
											aria-label="Nome da categoria"
											bind:value={editing.name}
										/>
									{:else}
										{category.name}
									{/if}
								</span>
							</td>
							<td class="col-description">
								{#if editing && editing.id === category.id}
									<input
										class="edit-input"
										type="text"
										maxlength={MAX_CATEGORY_DESCRIPTION_LENGTH}
										aria-label="Descrição da categoria"
										bind:value={editing.description}
									/>
								{:else if category.description}
									<span class="description-text">{category.description}</span>
									<span class="description-tooltip" aria-hidden="true">{category.description}</span>
								{:else}
									—
								{/if}
							</td>
							<td class="col-status">
								{#if editing && editing.id === category.id}
									<label class="toggle">
										<input
											type="checkbox"
											checked={category.isActive}
											disabled={!canToggleInactive(category)}
											onchange={() => toggleCategory(category.id)}
										/>
										<span>Ativa</span>
									</label>
								{:else}
									<span class="badge {category.isActive ? 'badge-active' : 'badge-inactive'}">
										{category.isActive ? 'Ativa' : 'Inativa'}
									</span>
								{/if}
							</td>
							<td class="col-actions">
								{#if editing && editing.id === category.id}
									<button
										class="icon-btn"
										type="button"
										aria-label="Salvar categoria"
										onclick={handleSaveEdit}
									>
										<Icon iconName="check" iconSize="sm" />
									</button>
									<button
										class="icon-btn"
										type="button"
										aria-label="Cancelar edição"
										onclick={() => handleCancelEdit(category)}
									>
										<Icon iconName="close" iconSize="sm" />
									</button>
								{:else}
									<button
										class="icon-btn"
										type="button"
										aria-label="Editar categoria"
										disabled={section.saving}
										onclick={() => handleEdit(category)}
									>
										<Icon iconName="edit" iconSize="sm" />
									</button>
									<button
										class="icon-btn"
										type="button"
										aria-label="Remover categoria"
										disabled={section.saving || !canRemoveCategory(category)}
										onclick={() => removeCategory(category.id)}
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
	</div>
</SettingsCard>

<style>
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
		color: var(--rich-black);
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
		width: 30%;
	}

	.col-description {
		position: relative;
		width: 34%;
		max-width: 0;
		overflow: visible;
		text-align: center;
	}

	.description-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		cursor: help;
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
		color: var(--on-primary);
		font: var(--paragrafo);
		font-size: 13px;
		line-height: 1.4;
		text-align: left;
		white-space: normal;
		opacity: 0;
		pointer-events: none;
		transition: var(--transition-default);
	}

	.description-text:hover + .description-tooltip {
		opacity: 1;
		transform: translate(-50%, 0);
	}

	.col-status {
		width: 16%;
	}

	.col-actions {
		width: 20%;
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
		color: var(--rich-black);
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

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: var(--gray);
	}

	.toggle input {
		accent-color: var(--secondary-color);
	}

	.categories-error {
		margin: 0;
		font-size: 13px;
		color: var(--status-red);
	}

	:global(.categories-body > button) {
		align-self: flex-start;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		font-size: 14px;
		font-weight: 600;
		white-space: nowrap;
	}
</style>
