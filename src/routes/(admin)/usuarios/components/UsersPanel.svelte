<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import type { PaginatedResponse } from '$lib/types/request';
	import type { Result } from '$lib/types/result';
	import type { AdminUser, UserAction } from '$lib/types/user';
	import UsersTable from './UsersTable.svelte';

	interface Props {
		result: Result<PaginatedResponse<AdminUser>>;
		canReadUsers: boolean;
		canManageUsers: boolean;
		administrableProfileIds: string[];
		currentUserId: string;
		isLoading: boolean;
		pageSize: number;
		onaction: (user: AdminUser, action: UserAction) => void;
		onretry: () => void;
		onpagechange: (page: number) => void;
	}

	let {
		result,
		canReadUsers,
		canManageUsers,
		administrableProfileIds,
		currentUserId,
		isLoading,
		pageSize,
		onaction,
		onretry,
		onpagechange
	}: Props = $props();

	let users = $derived<AdminUser[]>(result.ok ? result.data.data : []);
	let loadError = $derived(result.ok ? '' : result.error.message);
	let total = $derived(result.ok ? result.data.total : 0);
	let currentPage = $derived(result.ok ? result.data.page : 1);
	let totalPages = $derived(result.ok ? result.data.totalPages : 0);
	let startItem = $derived(total === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let endItem = $derived(Math.min(currentPage * pageSize, total));

	let visiblePages = $derived.by(() => {
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, index) => index + 1);
		}

		if (currentPage <= 3) {
			return [1, 2, 3, '...', totalPages];
		}

		if (currentPage >= totalPages - 2) {
			return [1, '...', totalPages - 2, totalPages - 1, totalPages];
		}

		return [1, '...', currentPage, '...', totalPages];
	});

	function goTo(page: number) {
		if (page < 1 || page > totalPages || page === currentPage) {
			return;
		}

		onpagechange(page);
	}
</script>

{#if canReadUsers && isLoading}
	<div class="state-card" role="status">
		<span class="spinner" aria-hidden="true"></span>

		<p>Carregando usuários...</p>
	</div>
{:else if canReadUsers && loadError}
	<div class="state-card error" role="alert">
		<p>
			{loadError}
		</p>

		<Button variant="outline" onclick={onretry}>Tentar novamente</Button>
	</div>
{:else if canReadUsers && users.length === 0}
	<NotFoundState
		title="Nenhum usuário encontrado"
		message="Não encontramos usuários para esta busca."
		hint="Ajuste a pesquisa ou cadastre um novo usuário."
	/>
{:else if canReadUsers}
	<UsersTable
		{users}
		canManage={canManageUsers}
		{administrableProfileIds}
		{currentUserId}
		{onaction}
	/>

	<div class="table-footer">
		<p class="count">
			Exibindo
			{startItem}-{endItem}
			de {total}
			usuário{total === 1 ? '' : 's'}
		</p>

		<div class="pagination" aria-label="Paginação">
			<button
				type="button"
				class="nav-button"
				disabled={currentPage === 1}
				onclick={() => goTo(currentPage - 1)}
				aria-label="Página anterior"
			>
				‹
			</button>

			{#each visiblePages as page, index (`${page}-${index}`)}
				{#if page === '...'}
					<span class="dots"> ... </span>
				{:else}
					<button
						type="button"
						class={['page-button', { active: currentPage === page }]}
						onclick={() => goTo(page as number)}
						aria-label={`Página ${page}`}
						aria-current={currentPage === page ? 'page' : undefined}
					>
						{page}
					</button>
				{/if}
			{/each}

			<button
				type="button"
				class="nav-button"
				disabled={currentPage === totalPages || totalPages === 0}
				onclick={() => goTo(currentPage + 1)}
				aria-label="Próxima página"
			>
				›
			</button>
		</div>
	</div>
{/if}

<style>
	.state-card {
		width: 100%;

		min-height: 250px;

		display: flex;
		flex-direction: column;

		align-items: center;
		justify-content: center;

		gap: var(--spacing-md);

		padding: var(--spacing-xl);

		background-color: var(--white);

		text-align: center;
	}

	.state-card p {
		margin: 0;

		color: var(--gray);
	}

	.state-card.error p {
		color: var(--status-red);
	}

	.spinner {
		width: 24px;
		height: 24px;

		border: 3px solid var(--white-gray);

		border-top-color: var(--primary-color);

		border-radius: 50%;

		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}

	.table-footer {
		width: 100%;

		min-height: 62px;

		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: var(--spacing-md);

		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--white);

		border-top: var(--border-default);

		flex-shrink: 0;
	}

	.count {
		margin: 0;

		font: var(--label);

		font-size: 11px;

		color: var(--gray);

		white-space: nowrap;
	}

	.pagination {
		display: flex;

		align-items: center;

		justify-content: flex-end;

		gap: 4px;
	}

	.page-button,
	.nav-button {
		min-width: 30px;
		height: 30px;

		display: inline-flex;

		align-items: center;
		justify-content: center;

		padding: 0 var(--spacing-sm);

		border: none;

		border-radius: var(--radius-sm);

		background: transparent;

		color: var(--black);

		font: var(--label);

		font-size: 12px;

		cursor: pointer;

		transition: var(--transition-default);
	}

	.page-button:hover:not(.active),
	.nav-button:hover:not(:disabled) {
		background-color: var(--tint);

		color: var(--secondary-color);
	}

	.page-button.active {
		background-color: var(--primary-color);

		color: var(--on-primary);
	}

	.nav-button {
		font-size: 20px;
		line-height: 1;
	}

	.nav-button:disabled {
		color: var(--white-gray);

		cursor: default;
	}

	.dots {
		min-width: 25px;
		height: 30px;

		display: inline-flex;

		align-items: center;
		justify-content: center;

		font: var(--label);

		font-size: 12px;

		color: var(--gray);
	}

	@media (max-width: 800px) {
		.table-footer {
			flex-direction: column;

			align-items: flex-start;
		}

		.pagination {
			width: 100%;

			justify-content: flex-end;
		}
	}
</style>
