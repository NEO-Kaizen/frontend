<script lang="ts">
	import { afterNavigate, invalidateAll, refreshAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import MetricsSummary from '$lib/components/MetricsSummary.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import { createUser, listUsers, updateUserStatus } from '$lib/services/user.service';
	import type { MetricItem } from '$lib/types/metrics';
	import type { PaginatedResponse } from '$lib/types/request';
	import type { Result } from '$lib/types/result';
	import type {
		AdminUser,
		CreateUserFormData,
		CreateUserResponse,
		UserAction,
		UserProfileResponse,
		UserStats,
		UserStatus
	} from '$lib/types/user';
	import { has } from '$lib/utils/permission-checks';
	import ConfirmActionModal from './components/ConfirmActionModal.svelte';
	import CreateUserModal from './components/CreateUserModal.svelte';
	import EditUserModal from './components/EditUserModal.svelte';
	import ResetPasswordModal from './components/ResetPasswordModal.svelte';
	import UsersTable from './components/UsersTable.svelte';
	import ProfileManagement from './components/ProfileManagement.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const canReadUsers = $derived(has('user:read', data.user));
	const canReadProfiles = $derived(has('profile:read', data.user));
	const canManageUsers = $derived(has('user:manage', data.user) && !data.profilesError);
	const canManageProfiles = $derived(has('profile:manage', data.user));

	const profilesErrorMessage = $derived.by(() => {
		if (!data.profilesError) {
			return '';
		}

		if (data.profilesError.status === 403) {
			return 'Você não tem permissão para carregar os perfis.';
		}

		if (data.profilesError.status !== undefined) {
			return 'Não foi possível carregar os perfis.';
		}

		return 'Falha de conexão ao carregar os perfis.';
	});

	const tabs = $derived([
		...(canReadUsers ? [{ id: 'usuarios', label: 'Usuários' }] : []),
		...(canReadProfiles ? [{ id: 'perfis', label: 'Perfis' }] : [])
	]);
	type PendingAction = {
		kind: UserAction;
		user: AdminUser;
	};

	let statsOverride = $state<UserStats | null>(null);
	let stats = $derived(statsOverride ?? data.stats);

	let metrics = $derived.by<MetricItem[]>(() => [
		{
			label: 'Total de Usuários',
			value: stats.total,
			iconName: 'group',
			tone: 'indigo'
		},
		{
			label: 'Ativos Agora',
			value: stats.active,
			iconName: 'userApproved',
			tone: 'neutral'
		},
		{
			label: 'Pendentes',
			value: stats.pending,
			iconName: 'pending',
			tone: 'orange'
		},
		{
			label: 'Perfil Admin',
			value: stats.admins,
			iconName: 'adminPanel',
			tone: 'danger'
		}
	]);

	let selectedProfileId = $state(untrack(() => data.profileId ?? ''));
	let activeTabSelection = $state('');
	let activeTab = $derived(
		tabs.some((tab) => tab.id === activeTabSelection)
			? activeTabSelection
			: canReadUsers
				? 'usuarios'
				: 'perfis'
	);
	let searchQuery = $state('');
	let isLoading = $state(false);
	let isRefreshing = $state(false);

	let fetchedResult = $state<Result<PaginatedResponse<AdminUser>> | null>(null);
	let result = $derived(fetchedResult ?? data.result);

	let users = $derived<AdminUser[]>(result.ok ? result.data.data : []);
	let loadError = $derived(result.ok ? '' : result.error.message);
	let total = $derived(result.ok ? result.data.total : 0);
	let currentPage = $derived(result.ok ? result.data.page : 1);
	let totalPages = $derived(result.ok ? result.data.totalPages : 0);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	// Navegações de filtro (GET) trocam `data.result`; limpar o override evita
	// que a tabela continue exibindo o resultado de uma busca/paginação anterior.
	// O select e a busca também voltam ao estado canônico da URL.
	afterNavigate(() => {
		clearTimeout(searchTimer);
		fetchedResult = null;
		selectedProfileId = data.profileId ?? '';
		searchQuery = '';
	});

	let successMessage = $state('');
	let successTimer: ReturnType<typeof setTimeout> | undefined;

	let isCreateOpen = $state(false);
	let isCreating = $state(false);
	let createError = $state('');

	let pendingAction = $state<PendingAction>();
	let isActing = $state(false);
	let actionError = $state('');

	let startItem = $derived(total === 0 ? 0 : (currentPage - 1) * data.pageSize + 1);

	let endItem = $derived(Math.min(currentPage * data.pageSize, total));

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

	async function loadUsers(
		page = currentPage,
		search = searchQuery,
		mode: 'refresh' | 'replace' = 'refresh'
	) {
		const canRefreshInPlace = result.ok && users.length > 0;

		if (mode === 'replace' || !canRefreshInPlace) {
			isLoading = true;
		} else {
			isRefreshing = true;
		}

		fetchedResult = await listUsers({
			profileId: selectedProfileId || undefined,
			search: search.trim() || undefined,
			page,
			pageSize: data.pageSize
		});

		isLoading = false;
		isRefreshing = false;
	}

	function applyUserUpdate(id: string, changes: Partial<AdminUser>) {
		const current = result;

		if (!current.ok) {
			return;
		}

		fetchedResult = {
			ok: true,
			data: {
				...current.data,
				data: current.data.data.map((currentUser) =>
					currentUser.id === id ? { ...currentUser, ...changes } : currentUser
				)
			}
		};
	}

	// Mutações de usuário mudam a contagem de vinculados por perfil; recarregar o
	// load mantém `userCount` e o bloqueio de desativação coerentes.
	async function refreshAfterUserMutation() {
		statsOverride = null;
		await invalidateAll();
	}

	function handleTabChange(tabId: string) {
		if (tabId === activeTab) {
			return;
		}

		activeTabSelection = tabId;
	}

	function handleTabKeydown(event: KeyboardEvent, index: number) {
		if (tabs.length < 2) return;

		let nextIndex: number;

		if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
		else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
		else if (event.key === 'Home') nextIndex = 0;
		else if (event.key === 'End') nextIndex = tabs.length - 1;
		else return;

		event.preventDefault();
		activeTabSelection = tabs[nextIndex].id;

		const tablist = (event.currentTarget as HTMLElement).closest('[role="tablist"]');
		const buttons = tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
		buttons?.[nextIndex]?.focus();
	}
	function handleSearchInput() {
		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			loadUsers(1, searchQuery);
		}, 350);
	}

	function handlePageChange(page: number) {
		if (page < 1 || page > totalPages || page === currentPage) {
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

	async function handleCreate(formData: CreateUserFormData): Promise<CreateUserResponse> {
		if (!canManageUsers) {
			createError = 'Você não tem permissão para cadastrar usuários.';
			return Promise.reject(new Error(createError));
		}

		isCreating = true;
		createError = '';

		const result = await createUser({
			name: formData.name.trim(),
			email: formData.email.trim(),
			profileId: formData.profileId,
			area: formData.area,
			department: formData.department,
			manager: formData.manager,
			additionalContact: formData.additionalContact,
			professional: formData.professional
		});

		isCreating = false;

		if (!result.ok) {
			createError = result.error.message;
			throw new Error(result.error.message);
		}

		searchQuery = '';

		showSuccess(`"${result.data.fullName}" cadastrado com sucesso.`);

		await loadUsers(1, '');
		await refreshAfterUserMutation();

		return result.data;
	}

	function closeCreateModal() {
		isCreateOpen = false;
		createError = '';
	}

	function showSuccess(message: string) {
		clearTimeout(successTimer);

		successMessage = message;

		successTimer = setTimeout(() => {
			successMessage = '';
		}, 4000);
	}

	function handleAction(user: AdminUser, action: UserAction) {
		if (!canManageUsers) {
			return;
		}

		if (
			!canManageUsers ||
			user.id === data.user?.id ||
			!data.administrableProfileIds.includes(user.profile.id)
		) {
			return;
		}

		actionError = '';

		pendingAction = {
			kind: action,
			user
		};
	}

	async function confirmStatusChange(status: UserStatus) {
		if (!canManageUsers) {
			return;
		}

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
		const userId = pendingAction.user.id;
		const profileName = pendingAction.user.profile.name;

		pendingAction = undefined;

		applyUserUpdate(userId, { status });

		showSuccess(
			status === 'Ativo'
				? `${profileName} "${userName}" ativado com sucesso.`
				: `${profileName} "${userName}" inativado com sucesso.`
		);

		await refreshAfterUserMutation();
	}

	function closePendingAction() {
		pendingAction = undefined;
		actionError = '';
	}

	function handleEditSaved(profile: UserProfileResponse) {
		const userId = pendingAction?.user.id;
		const userName = profile.fullName;
		if (userId) applyUserUpdate(userId, { name: profile.fullName, profile: profile.profile });
		pendingAction = undefined;
		showSuccess(`Dados administrativos de "${userName}" atualizados com sucesso.`);
		void refreshAfterUserMutation();
	}
</script>

<main class="content-container users-page">
	<!-- =========================
	     CABEÇALHO
	========================= -->

	<header class="page-header">
		<h1>{canReadUsers ? 'Gerenciamento de Usuários' : 'Gerenciamento de Perfis'}</h1>

		<p class="page-subtitle">
			{#if canReadUsers}
				Controle o acesso e permissões dos colaboradores no {data.portalConfig.platformName}.
			{:else}
				Consulte e gerencie os perfis de acesso do {data.portalConfig.platformName}.
			{/if}
		</p>
	</header>

	<!-- =========================
	     CARDS
	========================= -->

	{#if canReadUsers}
		<section class="stats-section">
			<MetricsSummary {metrics} />
		</section>
	{/if}

	<!-- =========================
	     SUCESSO
	========================= -->

	{#if canReadUsers && successMessage}
		<p class="success-banner" role="status">
			{successMessage}
		</p>
	{/if}

	{#if profilesErrorMessage}
		<div class="profiles-error" role="alert">
			<p>{profilesErrorMessage}</p>

			<Button variant="outline" onclick={() => refreshAll()}>Tentar novamente</Button>
		</div>
	{/if}

	<!-- =========================
	     CARD PRINCIPAL
	========================= -->

	{#if canReadUsers || canReadProfiles}
		<section class="users-card">
			<!-- PESQUISA + ADICIONAR -->

			{#if canReadUsers && activeTab === 'usuarios'}
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

					{#if canManageUsers}
						<Button
							variant="primary"
							onclick={() => {
								createError = '';
								isCreateOpen = true;
							}}
						>
							<Icon iconName="addUser" iconSize="sm" />
							Adicionar Usuário
						</Button>
					{/if}
				</div>
			{/if}

			<!-- =========================
		     ABAS
		========================= -->

			{#if tabs.length > 1}
				<div
					class="tabs"
					role="tablist"
					aria-label="Seções de gerenciamento"
					style:grid-template-columns={`repeat(${tabs.length}, minmax(0, 1fr))`}
				>
					{#each tabs as tab, index (tab.id)}
						<button
							type="button"
							role="tab"
							id={`users-tab-${tab.id}`}
							aria-selected={activeTab === tab.id}
							aria-controls="users-panel"
							tabindex={activeTab === tab.id ? 0 : -1}
							class={['tab', { active: activeTab === tab.id }]}
							onclick={() => handleTabChange(tab.id)}
							onkeydown={(event) => handleTabKeydown(event, index)}
						>
							{tab.label}
						</button>
					{/each}
				</div>
			{/if}

			{#if canReadUsers && canReadProfiles && activeTab === 'usuarios'}
				<form class="profile-filter" method="GET">
					<label for="profile-filter">Perfil</label>

					<select
						id="profile-filter"
						name="profileId"
						class="profile-select"
						bind:value={selectedProfileId}
					>
						<option value="">Todos</option>
						{#each data.activeProfiles as profile (profile.id)}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</select>

					<Button type="submit" variant="outline">Filtrar</Button>
				</form>
			{/if}

			{#if canReadUsers && data.profilesResult && !data.profilesResult.ok}
				<p class="profile-warning" role="alert">
					Não foi possível carregar os perfis: {data.profilesResult.error.message} O filtro e a edição
					por perfil ficam indisponíveis; as demais ações continuam disponíveis.
				</p>
			{/if}

			<!-- =========================
		     CONTEÚDO
		========================= -->

			<div
				id="users-panel"
				class={['tab-panel', { refreshing: isRefreshing }]}
				role={tabs.length > 1 ? 'tabpanel' : undefined}
				aria-busy={isRefreshing}
				aria-labelledby={tabs.length > 1 ? `users-tab-${activeTab}` : undefined}
			>
				{#if activeTab === 'perfis' && canReadProfiles}
					{#if data.user}
						<ProfileManagement
							user={data.user}
							canManage={canManageProfiles}
							profilesResult={data.profilesResult}
							profileKeyCatalogResult={data.profileKeyCatalogResult}
						/>
					{/if}
				{:else if canReadUsers && isLoading}
					<div class="state-card" role="status">
						<span class="spinner" aria-hidden="true"></span>

						<p>Carregando usuários...</p>
					</div>
				{:else if canReadUsers && loadError}
					<div class="state-card error" role="alert">
						<p>
							{loadError}
						</p>

						<Button variant="outline" onclick={() => loadUsers()}>Tentar novamente</Button>
					</div>
				{:else if canReadUsers && users.length === 0}
					<NotFoundState
						title="Nenhum usuário encontrado"
						message="Não encontramos usuários para esta busca."
						hint="Ajuste a pesquisa ou cadastre um novo usuário."
					/>
				{:else if canReadUsers}
					<!-- =========================
			     TABELA
			========================= -->

					<UsersTable
						{users}
						canManage={canManageUsers}
						administrableProfileIds={data.administrableProfileIds}
						currentUserId={data.user?.id ?? ''}
						onaction={handleAction}
					/>

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
										class={['page-button', { active: currentPage === page }]}
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
			</div>
		</section>
	{/if}
</main>

<!-- =========================
     CRIAR USUÁRIO
========================= -->

{#if canManageUsers && isCreateOpen}
	<CreateUserModal
		loading={isCreating}
		error={createError}
		categories={data.portalConfig.categories}
		profiles={data.assignableProfiles}
		onclose={closeCreateModal}
		oncreate={handleCreate}
	/>
{/if}

{#if canManageUsers && pendingAction?.kind === 'edit'}
	<EditUserModal
		user={pendingAction.user}
		categories={data.portalConfig.categories}
		profiles={data.profiles}
		assignableProfiles={data.assignableProfiles}
		onclose={closePendingAction}
		onsaved={handleEditSaved}
	/>
{/if}

<!-- =========================
     ATIVAR
========================= -->

{#if canManageUsers && pendingAction?.kind === 'activate'}
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

{#if canManageUsers && pendingAction?.kind === 'deactivate'}
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

{#if canManageUsers && pendingAction?.kind === 'reset' && pendingAction}
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
		color: var(--heading-color);
	}

	.page-subtitle {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
	}

	/* =========================
	   CARDS
	========================= */

	.stats-section {
		width: 100%;
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

	.profiles-error {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);

		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--status-red-bg);

		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.profiles-error p {
		margin: 0;

		color: var(--status-red);

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

	.profile-filter {
		width: 100%;

		display: flex;
		align-items: flex-end;
		flex-wrap: wrap;

		gap: var(--spacing-md);

		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--white);

		border-top: var(--border-default);

		border-bottom: var(--border-default);

		flex-shrink: 0;
	}

	.profile-filter label {
		font: var(--label);

		color: var(--black);
	}

	.profile-select {
		min-width: 200px;

		padding: var(--spacing-sm);

		border: var(--border-default);

		border-radius: var(--radius-sm);

		background-color: var(--white);

		color: var(--text-color-primary);

		font: var(--paragrafo);
	}

	.profile-select:focus-visible {
		outline: 2px solid var(--secondary-color);

		outline-offset: 1px;
	}

	.profile-warning {
		margin: 0;

		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--status-error-bg);

		color: var(--status-red);

		font: var(--paragrafo);
	}

	/* =========================
	   ABAS
	========================= */

	.tabs {
		width: 100%;

		display: grid;

		grid-template-columns: repeat(2, minmax(0, 1fr));

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

	.tab:focus-visible {
		outline: 1px solid var(--secondary-color);

		outline-offset: -1px;
	}

	.tab-panel {
		width: 100%;

		display: flex;
		flex-direction: column;

		min-height: 0;

		transition: opacity 0.15s ease;
	}

	.tab-panel.refreshing {
		opacity: 0.55;

		pointer-events: none;
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

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
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

	/* =========================
	   RESPONSIVO
	========================= */

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
</style>
