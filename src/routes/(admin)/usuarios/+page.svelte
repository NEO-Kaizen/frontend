<script lang="ts">
	import { afterNavigate, invalidateAll, refreshAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import MetricsSummary from '$lib/components/MetricsSummary.svelte';
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
	import UsersPanel from './components/UsersPanel.svelte';
	import ProfileManagement from './components/ProfileManagement.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const canReadUsers = $derived(has('user:read', data.user));
	const canReadProfiles = $derived(has('profile:read', data.user));
	const canManageUsers = $derived(has('user:manage', data.user));
	// Ações que dependem do catálogo de perfis (criar/editar/delegar) só podem
	// rodar quando o ator lê perfis e o catálogo carregou.
	const canManageUsersNow = $derived(canManageUsers && canReadProfiles && !data.profilesError);
	const canManageProfiles = $derived(has('profile:manage', data.user));
	const missingProfileRead = $derived(canManageUsers && !canReadProfiles);
	const profilesAvailabilityReason = $derived.by(() => {
		if (!canManageUsers || canManageUsersNow) return '';
		if (!canReadProfiles) {
			return 'Falta a permissão profile:read para listar os perfis e calcular a autoridade sobre os usuários.';
		}
		return 'Não foi possível carregar os perfis para calcular a autoridade sobre os usuários. Tente novamente.';
	});

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
	let tabButtons: HTMLButtonElement[] = $state([]);
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

	let currentPage = $derived(result.ok ? result.data.page : 1);
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

	async function loadUsers(
		page = currentPage,
		search = searchQuery,
		mode: 'refresh' | 'replace' = 'refresh'
	) {
		const canRefreshInPlace = result.ok && result.data.data.length > 0;

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
		tabButtons[nextIndex]?.focus();
	}
	function handleSearchInput() {
		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			loadUsers(1, searchQuery);
		}, 350);
	}

	function handlePageChange(page: number) {
		loadUsers(page, searchQuery);
	}

	async function handleCreate(formData: CreateUserFormData): Promise<CreateUserResponse> {
		if (!canManageUsersNow) {
			createError = profilesAvailabilityReason || 'Você não tem permissão para cadastrar usuários.';
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
		if (
			!canManageUsersNow ||
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
		if (!canManageUsersNow) {
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
		<div id="profiles-status" class="profiles-error" role="alert">
			<p>{profilesErrorMessage}</p>

			<Button variant="outline" onclick={() => refreshAll()}>Tentar novamente</Button>
		</div>
	{:else if missingProfileRead}
		<div id="profiles-status" class="profiles-status" role="alert">
			<p>{profilesAvailabilityReason}</p>
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
							disabled={!canManageUsersNow}
							title={canManageUsersNow ? undefined : profilesAvailabilityReason}
							aria-describedby={canManageUsersNow ? undefined : 'profiles-status'}
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
							bind:this={tabButtons[index]}
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
				{:else}
					<UsersPanel
						{result}
						{canReadUsers}
						canManageUsers={canManageUsersNow}
						actionsUnavailableReason={profilesAvailabilityReason}
						administrableProfileIds={data.administrableProfileIds}
						currentUserId={data.user?.id ?? ''}
						{isLoading}
						pageSize={data.pageSize}
						onaction={handleAction}
						onretry={() => loadUsers()}
						onpagechange={handlePageChange}
					/>
				{/if}
			</div>
		</section>
	{/if}
</main>

<!-- =========================
     CRIAR USUÁRIO
========================= -->

{#if canManageUsersNow && isCreateOpen}
	<CreateUserModal
		loading={isCreating}
		error={createError}
		categories={data.portalConfig.categories}
		profiles={data.assignableProfiles}
		onclose={closeCreateModal}
		oncreate={handleCreate}
	/>
{/if}

{#if canManageUsersNow && pendingAction?.kind === 'edit'}
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

{#if canManageUsersNow && pendingAction?.kind === 'activate'}
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

{#if canManageUsersNow && pendingAction?.kind === 'deactivate'}
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

{#if canManageUsersNow && pendingAction?.kind === 'reset' && pendingAction}
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

	.profiles-status {
		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--status-yellow-bg);

		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.profiles-status p {
		margin: 0;

		color: var(--heading-color);

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
	}
</style>
