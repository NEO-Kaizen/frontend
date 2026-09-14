<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { settingsState } from '$lib/config/settings.svelte';
	import type { PortalCategory } from '$lib/types/portal-config';
	import {
		MAX_CATEGORIES,
		MAX_CATEGORY_DESCRIPTION_LENGTH,
		MAX_CATEGORY_NAME_LENGTH
	} from '$lib/utils/validations';
	import SettingsCard from './SettingsCard.svelte';

	// Categoria em edição (nome/descrição locais do input); `null` = nenhuma.
	let editing = $state<{ id: number; name: string; description: string } | null>(null);

	function handleAdd() {
		settingsState.addCategory();
		const categories = settingsState.draft.categories;
		const added = categories[categories.length - 1];
		editing = added ? { id: added.id, name: added.name, description: added.description } : null;
	}

	function handleEdit(category: PortalCategory) {
		editing = { id: category.id, name: category.name, description: category.description };
	}

	function handleSaveEdit() {
		if (!editing) return;
		settingsState.updateCategory(editing.id, {
			name: editing.name,
			description: editing.description
		});
		editing = null;
	}

	function handleCancelEdit(category: PortalCategory) {
		// Cancelar uma categoria recém-adicionada (ainda sem nome) remove a linha.
		if (category.name.trim() === '') {
			settingsState.removeCategory(category.id);
		}
		editing = null;
	}

	// Impede desativar a última categoria ativa.
	function canToggleInactive(category: PortalCategory): boolean {
		if (!category.isActive) return true;
		const activeCategories = settingsState.draft.categories.filter((item) => item.isActive);
		return activeCategories.length > 1;
	}

	// Só permite remover se sobrar ao menos uma categoria ativa.
	function canRemoveCategory(category: PortalCategory): boolean {
		const categories = settingsState.draft.categories;
		if (categories.length === 1) return false;
		if (!category.isActive) return true;
		return categories.filter((item) => item.isActive).length > 1;
	}
</script>

<SettingsCard
	iconName="category"
	title="5. Categorias da demanda"
	description="Gerencie as categorias que alimentam o select do formulário de solicitação."
>
	<div class="categories-body">
		<Button
			variant="secondary"
			disabled={settingsState.saving || settingsState.draft.categories.length >= MAX_CATEGORIES}
			onclick={handleAdd}
		>
			<Icon iconName="addCircle" iconSize="sm" />
			Adicionar categoria
		</Button>

		{#if settingsState.categoriesError}
			<p class="categories-error" role="alert">{settingsState.categoriesError}</p>
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
					{#each settingsState.draft.categories as category (category.id)}
						<tr>
							<td class="col-name">
								<span class="drag-handle" aria-hidden="true" title="Reordenação em breve">
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
								{:else}
									{category.description || '—'}
								{/if}
							</td>
							<td class="col-status">
								{#if editing && editing.id === category.id}
									<label class="toggle">
										<input
											type="checkbox"
											checked={category.isActive}
											disabled={!canToggleInactive(category)}
											onchange={() => settingsState.toggleCategory(category.id)}
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
										disabled={settingsState.saving}
										onclick={() => handleEdit(category)}
									>
										<Icon iconName="edit" iconSize="sm" />
									</button>
									<button
										class="icon-btn"
										type="button"
										aria-label="Remover categoria"
										disabled={settingsState.saving || !canRemoveCategory(category)}
										onclick={() => settingsState.removeCategory(category.id)}
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
		width: 34%;
		max-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
	}

	.col-status {
		width: 16%;
	}

	.col-actions {
		width: 20%;
		text-align: end;
		white-space: nowrap;
	}

	.drag-handle {
		display: inline-flex;
		align-items: center;
		margin-right: var(--spacing-sm);
		vertical-align: middle;
		color: var(--gray);
		cursor: grab;
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
