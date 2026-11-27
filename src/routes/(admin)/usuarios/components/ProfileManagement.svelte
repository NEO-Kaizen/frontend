<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onDestroy, tick } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Profile, ProfileKeyCatalog } from '$lib/types/profile';
	import type { SessionUser } from '$lib/types/auth';
	import type { Result } from '$lib/types/result';
	import { changeProfileStatus } from '$lib/services/profile.service';
	import { sameComposition } from '$lib/services/profiles/profile-editor.rules';
	import { profileStatusRestriction } from '$lib/services/profiles/profile-status.service';
	import ProfileEditorModal from './ProfileEditorModal.svelte';
	import ManagementToolbar from './ManagementToolbar.svelte';
	import ProfileStatusDialog from './ProfileStatusDialog.svelte';
	import ProfileTable from './ProfileTable.svelte';
	import type { EditorMode } from './profile-management.types';

	interface Props {
		user: SessionUser;
		canManage: boolean;
		profilesResult: Result<Profile[]> | null;
		profileKeyCatalogResult: Result<ProfileKeyCatalog> | null;
	}

	let { user, canManage, profilesResult, profileKeyCatalogResult }: Props = $props();
	let profilesOverride = $state<Profile[] | null>(null);
	let profiles = $derived(profileSource());
	let profileSearchQuery = $state('');
	let visibleProfiles = $derived.by(() => {
		const query = profileSearchQuery.trim().toLocaleLowerCase('pt-BR');
		if (!query) return profiles;

		return profiles.filter(
			(profile) =>
				profile.name.toLocaleLowerCase('pt-BR').includes(query) ||
				(profile.description ?? '').toLocaleLowerCase('pt-BR').includes(query)
		);
	});
	let loadError = $derived(
		profilesOverride
			? ''
			: profilesResult && !profilesResult.ok
				? profilesResult.error.message
				: profilesResult
					? ''
					: 'Não foi possível carregar os perfis.'
	);
	let catalog = $derived(profileKeyCatalogResult?.ok ? profileKeyCatalogResult.data : null);
	let catalogError = $derived(
		profileKeyCatalogResult && !profileKeyCatalogResult.ok
			? profileKeyCatalogResult.error.message
			: ''
	);
	let isLoading = $state(false);
	let editorMode = $state<EditorMode | null>(null);
	let selectedProfile = $state<Profile | null>(null);
	let pendingStatus = $state<Profile | null>(null);
	let isChangingStatus = $state(false);
	let statusError = $state('');
	let successMessage = $state('');
	let successMessageTimer: ReturnType<typeof setTimeout> | undefined;

	function profileSource(): Profile[] {
		return profilesOverride ?? (profilesResult?.ok ? profilesResult.data : []);
	}

	function clearSuccessMessage() {
		if (successMessageTimer) clearTimeout(successMessageTimer);
		successMessageTimer = undefined;
		successMessage = '';
	}

	function showSuccessMessage(message: string) {
		clearSuccessMessage();
		successMessage = message;
		successMessageTimer = setTimeout(() => {
			successMessage = '';
			successMessageTimer = undefined;
		}, 5000);
	}

	onDestroy(() => {
		if (successMessageTimer) clearTimeout(successMessageTimer);
	});

	async function reloadData() {
		profilesOverride = null;
		isLoading = true;
		try {
			await invalidateAll();
		} finally {
			isLoading = false;
		}
	}

	function openEditor(mode: EditorMode, profile: Profile | null = null) {
		if (!canManage) return;
		clearSuccessMessage();
		editorMode = mode;
		selectedProfile = profile;
	}

	function closeEditor() {
		editorMode = null;
		selectedProfile = null;
	}

	function openStatus(profile: Profile) {
		clearSuccessMessage();
		statusError = '';
		pendingStatus = profile;
	}

	// Recarrega o `load` da página depois de mutações: filtro de usuários,
	// perfis atribuíveis e contagens derivam do SSR, não só da aba Perfis.
	// Cada perfil igual ao SSR volta a usar os dados do servidor; diferenças
	// locais (incluindo perfis só existentes no mock) continuam no override.
	async function syncPageData() {
		try {
			await invalidateAll();
			await tick();
			const localProfiles = profilesOverride;
			const refreshed = profilesResult?.ok ? profilesResult.data : null;
			if (localProfiles && refreshed) {
				profilesOverride = reconcileProfiles(localProfiles, refreshed);
			}
		} catch {
			// Mantém o estado local da aba; a próxima navegação recarrega o resto.
		}
	}

	function sameProfile(current: Profile, refreshed: Profile): boolean {
		return (
			current.name === refreshed.name &&
			(current.description ?? '') === (refreshed.description ?? '') &&
			current.isActive === refreshed.isActive &&
			current.isAssignableTriage === refreshed.isAssignableTriage &&
			current.isAssignableMapping === refreshed.isAssignableMapping &&
			sameComposition(current.permissions, refreshed.permissions)
		);
	}

	function reconcileProfiles(
		localProfiles: Profile[],
		refreshedProfiles: Profile[]
	): Profile[] | null {
		const refreshedById = new Map(refreshedProfiles.map((profile) => [profile.id, profile]));
		const localById = new Map(localProfiles.map((profile) => [profile.id, profile]));
		let hasLocalDifferences = false;
		const reconciled = refreshedProfiles.map((refreshedProfile) => {
			const localProfile = localById.get(refreshedProfile.id);
			if (!localProfile || sameProfile(localProfile, refreshedProfile)) return refreshedProfile;

			hasLocalDifferences = true;
			return { ...localProfile, userCount: refreshedProfile.userCount };
		});
		const localOnlyProfiles = localProfiles.filter((profile) => !refreshedById.has(profile.id));

		return hasLocalDifferences || localOnlyProfiles.length > 0
			? [...reconciled, ...localOnlyProfiles]
			: null;
	}

	function handleSaved(message: string, profile: Profile) {
		profileSearchQuery = '';
		const nextProfiles = profileSource();
		profilesOverride = nextProfiles.some((item) => item.id === profile.id)
			? nextProfiles.map((item) => (item.id === profile.id ? profile : item))
			: [...nextProfiles, profile];
		closeEditor();
		showSuccessMessage(message);
		void syncPageData();
	}

	async function confirmStatusChange() {
		if (!canManage || !pendingStatus) {
			return;
		}
		if (profileStatusRestriction(pendingStatus, { canEdit: canManage }).blocked) {
			return;
		}
		clearSuccessMessage();
		isChangingStatus = true;
		statusError = '';
		const profile = pendingStatus;
		const result = await changeProfileStatus(profile.id, !profile.isActive);
		isChangingStatus = false;
		if (!result.ok) {
			statusError = result.error.message;
			return;
		}
		pendingStatus = null;
		profilesOverride = profileSource().map((item) =>
			item.id === profile.id ? { ...item, isActive: !profile.isActive } : item
		);
		showSuccessMessage(
			`Perfil "${profile.name}" ${profile.isActive ? 'desativado' : 'ativado'} com sucesso.`
		);
		void syncPageData();
	}
</script>

<section class="profiles-panel" aria-label="Gerenciamento de perfis">
	<ManagementToolbar
		placeholder="Pesquisar perfis por nome ou descrição..."
		ariaLabel="Buscar perfis por nome ou descrição"
		hasActions={canManage}
		bind:value={profileSearchQuery}
	>
		{#snippet actions()}
			{#if canManage}
				<Button variant="primary" onclick={() => openEditor('create')}>
					<Icon iconName="addCircle" iconSize="sm" />
					Criar perfil
				</Button>
			{/if}
		{/snippet}
	</ManagementToolbar>

	<header class="panel-header">
		<div>
			<h2>Perfis de acesso</h2>
			<p>
				{canManage
					? 'Gerencie a composição de permissões e a disponibilidade dos perfis.'
					: 'Consulte a composição de permissões e a disponibilidade dos perfis.'}
			</p>
		</div>
	</header>

	<div class="panel-body">
		{#if profileSearchQuery.trim() !== '' && !isLoading && profilesResult?.ok && visibleProfiles.length > 0}
			<p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
				{visibleProfiles.length}
				{visibleProfiles.length === 1 ? 'perfil encontrado' : 'perfis encontrados'}.
			</p>
		{/if}

		{#if successMessage}
			<p class="success-message" role="status">{successMessage}</p>
		{/if}

		{#if isLoading}
			<div class="state" role="status">
				<span class="spinner" aria-hidden="true"></span>Carregando perfis...
			</div>
		{:else if loadError}
			<div class="state error" role="alert">
				<p>{loadError}</p>
				<Button variant="outline" onclick={reloadData}>Tentar novamente</Button>
			</div>
		{:else}
			<ProfileTable
				profiles={visibleProfiles}
				{canManage}
				{user}
				onedit={(profile) => openEditor('edit', profile)}
				onduplicate={(profile) => openEditor('duplicate', profile)}
				onstatus={openStatus}
			/>
		{/if}
	</div>
</section>

{#if editorMode}
	{#if catalogError || !catalog}
		<Modal title="Não foi possível abrir o formulário" onclose={closeEditor}>
			<div class="state error" role="alert">
				<p>{catalogError || 'Catálogo de permissões indisponível.'}</p>
				<Button variant="outline" onclick={reloadData}>Tentar novamente</Button>
			</div>
		</Modal>
	{:else}
		<ProfileEditorModal
			mode={editorMode}
			profile={selectedProfile}
			{catalog}
			{user}
			onclose={closeEditor}
			onsaved={handleSaved}
		/>
	{/if}
{/if}

{#if pendingStatus}
	<ProfileStatusDialog
		profile={pendingStatus}
		{isChangingStatus}
		{statusError}
		onclose={() => (pendingStatus = null)}
		onconfirm={confirmStatusChange}
	/>
{/if}

<style>
	.profiles-panel {
		width: 100%;

		display: flex;
		flex-direction: column;
	}
	.panel-header {
		width: 100%;

		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: var(--spacing-md);

		padding: var(--spacing-sm) var(--spacing-md);
		min-height: 74px;

		border-bottom: var(--border-default);

		flex-shrink: 0;
	}
	.panel-body {
		width: 100%;
		min-width: 0;

		display: flex;
		flex-direction: column;

		gap: var(--spacing-md);

		padding: var(--spacing-md);
	}
	.panel-header h2 {
		margin: 0 0 var(--spacing-xs);
		color: var(--heading-color);
		font: var(--h3);
	}
	.panel-header p {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
	}
	.success-message {
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--status-green-bg);
		color: var(--status-green);
	}
	.state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		min-height: 180px;
		margin: 0;
		padding: var(--spacing-xl);
		color: var(--gray);
		text-align: center;
	}
	.state p {
		margin: 0;
	}
	.state.error {
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
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 720px) {
		.panel-header {
			align-items: flex-start;
			flex-direction: column;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
