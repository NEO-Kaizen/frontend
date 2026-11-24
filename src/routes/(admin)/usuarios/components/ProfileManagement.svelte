<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Profile, ProfileKeyCatalog } from '$lib/types/profile';
	import type { SessionUser } from '$lib/types/auth';
	import type { Result } from '$lib/types/result';
	import { changeProfileStatus } from '$lib/services/profile.service';
	import ProfileEditorModal from './ProfileEditorModal.svelte';
	import ProfileStatusDialog from './ProfileStatusDialog.svelte';
	import ProfileTable from './ProfileTable.svelte';
	import type { EditorMode, ProfileView } from './profile-management.types';

	interface Props {
		user: SessionUser;
		canManage: boolean;
		profilesResult: Result<Profile[]> | null;
		profileKeyCatalogResult: Result<ProfileKeyCatalog> | null;
	}

	let { user, canManage, profilesResult, profileKeyCatalogResult }: Props = $props();
	let profilesOverride = $state<Profile[] | null>(null);
	let profiles = $derived(profileSource().map(normalizeProfile));
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
	let pendingStatus = $state<ProfileView | null>(null);
	let isChangingStatus = $state(false);
	let statusError = $state('');
	let successMessage = $state('');
	let successMessageTimer: ReturnType<typeof setTimeout> | undefined;

	function normalizeProfile(profile: Profile): ProfileView {
		return {
			source: profile,
			id: profile.id,
			name: profile.name,
			description: profile.description ?? '',
			composition: profile.permissions.map(({ key, custody }) => ({ key, custody })),
			isRoot: profile.isRoot,
			isActive: profile.isActive,
			isAssignableTriage: profile.isAssignableTriage,
			isAssignableMapping: profile.isAssignableMapping,
			userCount: profile.userCount
		};
	}

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

	function openStatus(profile: ProfileView) {
		clearSuccessMessage();
		statusError = '';
		pendingStatus = profile;
	}

	function handleSaved(message: string, profile: Profile) {
		const nextProfiles = profileSource();
		profilesOverride = nextProfiles.some((item) => item.id === profile.id)
			? nextProfiles.map((item) => (item.id === profile.id ? profile : item))
			: [...nextProfiles, profile];
		closeEditor();
		showSuccessMessage(message);
	}

	async function confirmStatusChange() {
		if (
			!canManage ||
			!pendingStatus ||
			(pendingStatus.isActive && (pendingStatus.isRoot || pendingStatus.userCount > 0))
		) {
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
	}
</script>

<section class="profiles-panel" aria-label="Gerenciamento de perfis">
	<header class="panel-header">
		<div>
			<h2>Perfis de acesso</h2>
			<p>
				{canManage
					? 'Gerencie a composição de permissões e a disponibilidade dos perfis.'
					: 'Consulte a composição de permissões e a disponibilidade dos perfis.'}
			</p>
		</div>
		{#if canManage}
			<Button variant="primary" onclick={() => openEditor('create')}>Criar perfil</Button>
		{/if}
	</header>

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
			{profiles}
			{canManage}
			{user}
			onedit={(profile) => openEditor('edit', profile)}
			onduplicate={(profile) => openEditor('duplicate', profile)}
			onstatus={openStatus}
		/>
	{/if}
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
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
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
		margin: 0;
		padding: var(--spacing-xl);
		color: var(--gray);
		text-align: center;
	}
	.state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		min-height: 180px;
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
