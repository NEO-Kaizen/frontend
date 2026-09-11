<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SettingsCard from './SettingsCard.svelte';

	interface Category {
		name: string;
		description: string;
		status: string;
	}

	const categories: Category[] = [
		{ name: 'Suporte Técnico', description: 'Problemas de TI...', status: 'Ativo' },
		{ name: 'Financeiro', description: 'Demandas finance...', status: 'Ativo' },
		{ name: 'RH', description: 'Questões de RH', status: 'Ativo' },
		{ name: 'Infraestrutura', description: 'Questões de infra...', status: 'Inativo' },
		{ name: 'Outros', description: 'Outros assuntos', status: 'Ativo' }
	];
</script>

<SettingsCard
	iconName="category"
	title="5. Categorias da demanda"
	description="Gerencie as categorias que alimentam o select do formulário de solicitação."
>
	<div class="categories-body">
		<Button variant="secondary">
			<Icon iconName="addCircle" iconSize="sm" />
			Adicionar categoria
		</Button>

		<div class="categories-table">
			<table>
				<thead>
					<tr>
						<th scope="col" class="col-name">Nome da categoria</th>
						<th scope="col" class="col-description">Descrição</th>
						<th scope="col" class="col-status">Status</th>
						<th scope="col" class="col-edit">Editar</th>
					</tr>
				</thead>
				<tbody>
					{#each categories as category (category.name)}
						<tr>
							<td class="col-name">
								<span class="drag-handle" aria-hidden="true">
									<Icon iconName="dragIndicator" iconSize="sm" />
								</span>
								{category.name}
							</td>
							<td class="col-description">{category.description}</td>
							<td class="col-status">{category.status}</td>
							<td class="col-edit">
								<span class="edit-icon" aria-hidden="true">
									<Icon iconName="edit" iconSize="sm" />
								</span>
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
		gap: var(--spacing-md);
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

	.col-name {
		width: 32%;
	}

	.col-description {
		width: 34%;
		max-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.col-status {
		width: 20%;
	}

	.col-edit {
		width: 14%;
		text-align: center;
	}

	.drag-handle {
		display: inline-flex;
		align-items: center;
		margin-right: var(--spacing-sm);
		vertical-align: middle;
		color: var(--gray);
	}

	.edit-icon {
		display: inline-flex;
		align-items: center;
		color: var(--gray);
	}

	:global(.categories-body button) {
		align-self: flex-start;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		font-size: 14px;
		font-weight: 600;
		white-space: nowrap;
	}
</style>
