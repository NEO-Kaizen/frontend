<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import { createUser, listUsers, updateUserStatus } from '$lib/services/user.service';
	import type { AdminUser, CreateUserData, UserAction, UserStatus } from '$lib/types/user';
	import ConfirmActionModal from './components/ConfirmActionModal.svelte';
	import CreateUserModal from './components/CreateUserModal.svelte';
	import ResetPasswordModal from './components/ResetPasswordModal.svelte';
	import UsersTable from './components/UsersTable.svelte';

	const PAGE_SIZE = 10;

	/*
	 * Somente a aba de Solicitantes está funcional
	 * no escopo atual da task.
	 */
	const tabs = [
		{
			id: 'todos',
			label: 'Todos',
			disabled: true
		},
		{
			id: 'administradores',
			label: 'Administradores',
			disabled: true
		},
		{
			id: 'analistas',
			label: 'Analistas',
			disabled: true
		},
		{
			id: 'gestores',
			label: 'Gestores',
			disabled: true
		},
		{
			id: 'solicitantes',
			label: 'Solicitantes',
			disabled: false
		}
	] as const;

	/*
	 * Dados enviados pelo modal.
	 *
	 * O componente não gera senha.
	 * A senha temporária deve vir do service/API/mock.
	 */
	type CreateUserData = {
		name: string;
		email: string;
	};

	type PendingAction = {
		kind: UserAction;
		user: AdminUser;
	};

	let activeTab = $state('solicitantes');

	let users = $state<AdminUser[]>([]);

	/* =========================
	   LISTAGEM
	========================= */

	let isLoading = $state(false);
	let loadError = $state('');

	let total = $state(0);
	let currentPage = $state(1);
	let totalPages = $state(0);

	/* =========================
	   PESQUISA
	========================= */

	let searchQuery = $state('');
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	/* =========================
	   FEEDBACK
	========================= */

	let successMessage = $state('');

	let successTimer: ReturnType<typeof setTimeout> | undefined;

	/* =========================
	   CRIAÇÃO
	========================= */

	let isCreateOpen = $state(false);
	let isCreating = $state(false);
	let createError = $state('');

	/* =========================
	   AÇÕES
	========================= */

	let pendingAction = $state<PendingAction>();

	let isActing = $state(false);
	let actionError = $state('');

	/* =========================
	   PAGINAÇÃO
	========================= */

	let startItem = $derived(total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1);

	let endItem = $derived(Math.min(currentPage * PAGE_SIZE, total));

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

	/* =========================
	   CARREGAMENTO
	========================= */

	async function loadUsers(page = currentPage, search = searchQuery) {
		isLoading = true;
		loadError = '';

		const result = await listUsers({
			search: search.trim() || undefined,
			page,
			pageSize: PAGE_SIZE
		});

		isLoading = false;

		if (result.ok) {
			users = result.data.data;
			total = result.data.total;
			currentPage = result.data.page;

			totalPages = result.data.totalPages || Math.ceil(result.data.total / PAGE_SIZE);

			return;
		}

		loadError = result.error.message;

		users = [];
		total = 0;
		totalPages = 0;
		currentPage = 1;
	}

	onMount(() => {
		loadUsers(1, '');
	});

	/* =========================
	   PESQUISA
	========================= */

	function handleSearchInput() {
		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			loadUsers(1, searchQuery);
		}, 350);
	}

	/* =========================
	   TROCA DE PÁGINA
	========================= */

	function handlePageChange(page: number) {
		if (page < 1) return;

		if (page > totalPages) {
			return;
		}

		if (page === currentPage) {
			return;
		}

		loadUsers(page, searchQuery);
	}

	function previousPage() {
		handlePageChange(currentPage - 1);
	}

	function nextPage() {
		handlePageChange(currentPage + 1);
	}

	/* =========================
	   CRIAÇÃO
	========================= */

	async function handleCreate(data: CreateUserData) {
		isCreating = true;
		createError = '';

		const result = await createUser({
			name: data.name.trim(),
			email: data.email.trim(),
			role: 'Solicitante',
			status: 'Ativo'
		});

		isCreating = false;

		if (!result.ok) {
			createError = result.error.message;
			throw new Error(result.error.message);
		}

		searchQuery = '';

		showSuccess(`Solicitante "${result.data.user.name}" cadastrado com sucesso.`);

		await loadUsers(1, '');

		return result.data;
	}

	function closeCreateModal() {
		isCreateOpen = false;
		createError = '';
	}

	/* =========================
	   MENSAGEM DE SUCESSO
	========================= */

	function showSuccess(message: string) {
		clearTimeout(successTimer);

		successMessage = message;

		successTimer = setTimeout(() => {
			successMessage = '';
		}, 4000);
	}

	/* =========================
	   AÇÕES
	========================= */

	function handleAction(user: AdminUser, action: UserAction) {
		actionError = '';

		pendingAction = {
			kind: action,
			user
		};
	}

	async function confirmStatusChange(status: UserStatus) {
		if (!pendingAction) {
			return;
		}

		isActing = true;
		actionError = '';

		const result = await updateUserStatus(pendingAction.user.id, status);

		isActing = false;

		if (!result.ok) {
			actionError = result.error.message;

			return;
		}

		const userName = pendingAction.user.name;

		pendingAction = undefined;

		showSuccess(
			status === 'Ativo'
				? `Solicitante "${userName}" ativado com sucesso.`
				: `Solicitante "${userName}" inativado com sucesso.`
		);

		await loadUsers(currentPage, searchQuery);
	}

	function closePendingAction() {
		pendingAction = undefined;

		actionError = '';
	}
</script>

<main class="content-container users-page">
	<!-- =========================
	     CABEÇALHO
	========================= -->

	<header class="page-header">
		<h1>Gerenciamento de Usuários</h1>

		<p class="page-subtitle">Controle o acesso e permissões dos colaboradores no MAAT Flow.</p>
	</header>

	<!-- =========================
	     CARDS
	========================= -->

	<section class="stats-grid">
		<!-- TOTAL DE USUÁRIOS -->

		<div class="stat-card">
			<div class="stat-icon icon-users">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>

					<circle cx="9" cy="7" r="4"></circle>

					<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>

					<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
				</svg>
			</div>

			<div class="stat-content">
				<span class="stat-label"> TOTAL DE USUÁRIOS </span>

				<strong> 1,284 </strong>
			</div>
		</div>

		<!-- ATIVOS -->

		<div class="stat-card">
			<div class="stat-icon icon-active">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>

					<circle cx="9" cy="7" r="4"></circle>

					<path d="m16 11 2 2 4-4"></path>
				</svg>
			</div>

			<div class="stat-content">
				<span class="stat-label"> ATIVOS AGORA </span>

				<strong> 842 </strong>
			</div>
		</div>

		<!-- PENDENTES -->

		<div class="stat-card">
			<div class="stat-icon icon-pending">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9"></circle>

					<circle cx="8" cy="12" r="1"></circle>

					<circle cx="12" cy="12" r="1"></circle>

					<circle cx="16" cy="12" r="1"></circle>
				</svg>
			</div>

			<div class="stat-content">
				<span class="stat-label"> PENDENTES </span>

				<strong> 18 </strong>
			</div>
		</div>

		<!-- ADMIN -->

		<div class="stat-card">
			<div class="stat-icon icon-admin">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>

					<path d="M12 8v8"></path>
				</svg>
			</div>

			<div class="stat-content">
				<span class="stat-label"> PERFIL ADMIN </span>

				<strong> 42 </strong>
			</div>
		</div>
	</section>

	<!-- =========================
	     SUCESSO
	========================= -->

	{#if successMessage}
		<p class="success-banner" role="status">
			{successMessage}
		</p>
	{/if}

	<!-- =========================
	     CARD PRINCIPAL
	========================= -->

	<section class="users-card">
		<!-- PESQUISA + ADICIONAR -->

		<div class="toolbar">
			<div class="search-box">
				<Input
					icon="search"
					type="search"
					placeholder="Pesquisar por nome ou e-mail..."
					aria-label="Buscar usuários por nome ou e-mail"
					bind:value={searchQuery}
					oninput={handleSearchInput}
				/>
			</div>

			<Button
				variant="primary"
				onclick={() => {
					createError = '';
					isCreateOpen = true;
				}}
			>
				<svg
					class="add-user-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>

					<circle cx="8" cy="7" r="4"></circle>

					<path d="M19 8v6"></path>

					<path d="M16 11h6"></path>
				</svg>

				Adicionar Usuário
			</Button>
		</div>

		<!-- =========================
		     ABAS
		========================= -->

		<div class="tabs" role="tablist" aria-label="Perfis de usuário">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === tab.id}
					disabled={tab.disabled}
					class="tab"
					class:active={activeTab === tab.id}
					class:inactive={tab.disabled}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- =========================
		     CONTEÚDO
		========================= -->

		{#if isLoading}
			<div class="state-card" role="status">
				<span class="spinner" aria-hidden="true"></span>

				<p>Carregando usuários...</p>
			</div>
		{:else if loadError}
			<div class="state-card error" role="alert">
				<p>
					{loadError}
				</p>

				<Button variant="outline" onclick={() => loadUsers()}>Tentar novamente</Button>
			</div>
		{:else if users.length === 0}
			<NotFoundState
				title="Nenhum usuário encontrado"
				message="Não encontramos usuários para esta busca."
				hint="Ajuste a pesquisa ou cadastre um novo solicitante."
			/>
		{:else}
			<!-- =========================
			     TABELA
			========================= -->

			<UsersTable {users} onaction={handleAction} />

			<!-- =========================
			     PAGINAÇÃO
			========================= -->

			<div class="table-footer">
				<p class="count">
					Exibindo
					{startItem}-{endItem}
					de {total}
					usuário{total === 1 ? '' : 's'}
				</p>

				<div class="pagination" aria-label="Paginação">
					<!-- ANTERIOR -->

					<button
						type="button"
						class="nav-button"
						disabled={currentPage === 1}
						onclick={previousPage}
						aria-label="Página anterior"
					>
						‹
					</button>

					<!-- PÁGINAS -->

					{#each visiblePages as page, index (`${page}-${index}`)}
						{#if page === '...'}
							<span class="dots"> ... </span>
						{:else}
							<button
								type="button"
								class="page-button"
								class:active={currentPage === page}
								onclick={() => handlePageChange(page as number)}
								aria-label={`Página ${page}`}
								aria-current={currentPage === page ? 'page' : undefined}
							>
								{page}
							</button>
						{/if}
					{/each}

					<!-- PRÓXIMA -->

					<button
						type="button"
						class="nav-button"
						disabled={currentPage === totalPages || totalPages === 0}
						onclick={nextPage}
						aria-label="Próxima página"
					>
						›
					</button>
				</div>
			</div>
		{/if}
	</section>
</main>

<!-- =========================
     CRIAR USUÁRIO
========================= -->

{#if isCreateOpen}
	<CreateUserModal
		loading={isCreating}
		error={createError}
		onclose={closeCreateModal}
		oncreate={handleCreate}
	/>
{/if}

<!-- =========================
     ATIVAR
========================= -->

{#if pendingAction?.kind === 'activate'}
	<ConfirmActionModal
		title="Ativar usuário"
		message={`Confirmar a ativação de "${pendingAction.user.name}"?`}
		confirmLabel="Ativar"
		loading={isActing}
		error={actionError}
		onconfirm={() => confirmStatusChange('Ativo')}
		oncancel={closePendingAction}
	/>
{/if}

<!-- =========================
     INATIVAR
========================= -->

{#if pendingAction?.kind === 'deactivate'}
	<ConfirmActionModal
		title="Inativar usuário"
		message={`Ao inativar, "${pendingAction.user.name}" perde o acesso ao portal. Confirmar?`}
		confirmLabel="Inativar"
		loading={isActing}
		error={actionError}
		onconfirm={() => confirmStatusChange('Inativo')}
		oncancel={closePendingAction}
	/>
{/if}

<!-- =========================
     REDEFINIR SENHA
========================= -->

{#if pendingAction?.kind === 'reset' && pendingAction}
	<ResetPasswordModal user={pendingAction.user} onclose={closePendingAction} />
{/if}

<style>
	.users-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	/* =========================
	   CABEÇALHO
	========================= */

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.page-header h1 {
		margin: 0;
		font: var(--h1);
		color: var(--primary-color);
	}

	.page-subtitle {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
	}

	/* =========================
	   CARDS
	========================= */

	.stats-grid {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--spacing-md);
	}

	.stat-card {
		min-height: 120px;

		display: flex;
		flex-direction: column;
		justify-content: space-between;

		padding: var(--spacing-md);

		background-color: var(--white);

		border: var(--border-default);

		border-radius: var(--radius-sm);

		box-shadow: var(--regular-shadow);
	}

	.stat-icon {
		width: 34px;
		height: 34px;

		display: flex;
		align-items: center;
		justify-content: center;

		border-radius: var(--radius-sm);
	}

	.stat-icon svg {
		width: 20px;
		height: 20px;
	}

	.icon-users {
		background-color: var(--status-blue-bg);

		color: var(--primary-color);
	}

	.icon-active {
		background-color: var(--status-green-bg);

		color: var(--status-green);
	}

	.icon-pending {
		background-color: var(--status-yellow-bg);

		color: var(--status-yellow);
	}

	.icon-admin {
		background-color: var(--status-blue-bg);

		color: var(--secondary-color);
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-label {
		font: var(--label);
		font-size: 11px;
		color: var(--black);
		text-transform: uppercase;
	}

	.stat-content strong {
		font: var(--h3);
		color: var(--rich-black);
	}

	/* =========================
	   SUCESSO
	========================= */

	.success-banner {
		margin: 0;

		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--status-green-bg);

		color: var(--status-green);

		border-radius: var(--radius-sm);

		font: var(--label);
	}

	/* =========================
	   CARD PRINCIPAL
	========================= */

	.users-card {
		width: 100%;

		display: flex;
		flex-direction: column;

		background-color: var(--white);

		border: var(--border-default);

		border-radius: var(--radius-md);

		box-shadow: var(--regular-shadow);

		overflow: hidden;
	}

	.users-card :global(.table-wrapper) {
		width: 100%;
		max-width: 100%;

		border: none;
		border-radius: 0;
		box-shadow: none;
	}

	/* =========================
	   TOOLBAR
	========================= */

	.toolbar {
		width: 100%;

		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: var(--spacing-md);

		padding: var(--spacing-sm);

		background-color: var(--background-color);

		flex-shrink: 0;
	}

	.search-box {
		flex: 1;

		width: 100%;
		max-width: none;
		min-width: 0;
	}

	.add-user-icon {
		width: 18px;
		height: 18px;

		flex-shrink: 0;
	}

	/* =========================
	   ABAS
	========================= */

	.tabs {
		width: 100%;

		display: grid;

		grid-template-columns: repeat(5, 1fr);

		align-items: stretch;

		min-height: 44px;

		padding: 0 var(--spacing-sm);

		background-color: var(--white);

		border-top: var(--border-default);

		border-bottom: var(--border-default);

		flex-shrink: 0;
	}

	.tab {
		position: relative;

		padding: 0 var(--spacing-sm);

		border: none;

		background: none;

		color: var(--black);

		font: var(--label);

		font-size: 12px;

		cursor: pointer;

		transition: var(--transition-default);
	}

	.tab::after {
		content: '';

		position: absolute;

		left: 0;
		right: 0;
		bottom: 0;

		height: 2px;

		background-color: transparent;
	}

	.tab.active {
		color: var(--secondary-color);
	}

	.tab.active::after {
		background-color: var(--secondary-color);
	}

	.tab.inactive {
		opacity: 0.5;

		cursor: not-allowed;
	}

	.tab:focus-visible {
		outline: 1px solid var(--secondary-color);

		outline-offset: -1px;
	}

	/* =========================
	   ESTADOS
	========================= */

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

	/* =========================
	   RODAPÉ
	========================= */

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

	/* =========================
	   PAGINAÇÃO
	========================= */

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
		background-color: var(--status-blue-bg);

		color: var(--secondary-color);
	}

	.page-button.active {
		background-color: var(--primary-color);

		color: var(--white);
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

	/* =========================
	   RESPONSIVO
	========================= */

	@media (max-width: 900px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 800px) {
		.toolbar {
			flex-direction: column;

			align-items: stretch;
		}

		.tabs {
			display: flex;

			overflow-x: auto;

			padding: 0;
		}

		.tab {
			min-width: 130px;
			height: 44px;
		}

		.table-footer {
			flex-direction: column;

			align-items: flex-start;
		}

		.pagination {
			width: 100%;

			justify-content: flex-end;
		}
	}

	@media (max-width: 500px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
