<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Profile, ProfileKeyCatalog } from '$lib/types/profile';
	import type { SessionUser } from '$lib/types/auth';
	import type { PermissionCustody } from '$lib/types/permission';
	import type { Result } from '$lib/types/result';
	import { changeProfileStatus } from '$lib/services/profile.service';
	import { canGrantCustody } from '$lib/utils/permission-checks';
	import ProfileEditorModal from './ProfileEditorModal.svelte';

	interface Props {
		user: SessionUser;
		canManage: boolean;
		profilesResult: Result<Profile[]> | null;
		profileKeyCatalogResult: Result<ProfileKeyCatalog> | null;
	}

	type ProfileView = {
		source: Profile;
		id: string;
		name: string;
		description: string;
		composition: Profile['permissions'];
		isRoot: boolean;
		isActive: boolean;
		isAssignableTriage: boolean;
		isAssignableMapping: boolean;
		userCount: number;
	};

	type EditorMode = 'create' | 'edit' | 'duplicate';

	const custodyLabels: Record<PermissionCustody, string> = {
		global: 'Global',
		own: 'Próprio',
		assigned: 'Atribuído',
		all: 'Todos'
	};
	const duplicateRestrictionMessage =
		'Não é possível duplicar: sua conta não pode conceder todas as permissões e escopos herdados deste perfil.';

	let { user, canManage, profilesResult, profileKeyCatalogResult }: Props = $props();
	let profiles = $derived(profilesResult?.ok ? profilesResult.data.map(normalizeProfile) : []);
	let loadError = $derived(
		profilesResult && !profilesResult.ok
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

	function canDuplicateProfile(profile: Profile): boolean {
		return profile.permissions.every((requestedPermission) =>
			user.permissions.some(
				(actorPermission) =>
					actorPermission.key === requestedPermission.key &&
					canGrantCustody(actorPermission.custody, requestedPermission.custody)
			)
		);
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

	async function handleSaved(message: string) {
		closeEditor();
		showSuccessMessage(message);
		await reloadData();
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
		showSuccessMessage(
			`Perfil "${profile.name}" ${profile.isActive ? 'desativado' : 'ativado'} com sucesso.`
		);
		await reloadData();
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
	{:else if profiles.length === 0}
		<p class="empty-state">Nenhum perfil encontrado.</p>
	{:else}
		<div class="table-scroll">
			<table>
				<thead>
					<tr>
						<th scope="col">Nome</th>
						<th scope="col">Composição</th>
						<th scope="col">Atribuição</th>
						<th scope="col">Status</th>
						<th scope="col">Usuários</th>
						{#if canManage}
							<th scope="col"><span class="sr-only">Ações</span></th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each profiles as profile (profile.id)}
						{@const canDuplicate = canDuplicateProfile(profile.source)}
						{@const cannotEditRootProfile = profile.isRoot && user.role !== 'Admin Root'}
						{@const statusRestrictionMessage =
							profile.isActive && profile.isRoot
								? 'O perfil Admin Root não pode ser desativado.'
								: profile.isActive && profile.userCount > 0
									? `Não é possível desativar: ${profile.userCount} usuário(s) ainda utiliza(m) este perfil.`
									: ''}
						<tr>
							<th scope="row">
								<div class="name-cell">
									<strong>{profile.name || 'Perfil sem nome'}</strong>
									{#if profile.isRoot}
										<span class="root-badge">Root</span>
									{/if}
								</div>
								{#if profile.description}
									<span class="description">{profile.description}</span>
								{/if}
							</th>
							<td>
								<span class="composition-count">{profile.composition.length} chaves</span>
								{#if profile.composition.length > 0}
									<span class="composition-list">
										{profile.composition
											.map(
												(permission) =>
													`${permission.key} (escopo: ${custodyLabels[permission.custody]})`
											)
											.join(', ')}
									</span>
								{:else}
									<span class="composition-list">Sem permissões</span>
								{/if}
							</td>
							<td>
								<div class="flags">
									<span class={{ enabled: profile.isAssignableTriage }}>Triagem</span>
									<span class={{ enabled: profile.isAssignableMapping }}>Mapeamento</span>
								</div>
							</td>
							<td>
								<span class={['status', { active: profile.isActive }]}>
									<span aria-hidden="true"></span>
									{profile.isActive ? 'Ativo' : 'Inativo'}
								</span>
								{#if profile.isActive && profile.isRoot}
									<small class="status-note" id={`status-guidance-${profile.id}`}>
										O perfil Admin Root não pode ser desativado.
									</small>
								{:else if profile.isActive && profile.userCount > 0}
									<small class="status-note" id={`status-guidance-${profile.id}`}>
										Não pode desativar: {profile.userCount}
										{profile.userCount === 1 ? 'usuário utiliza' : 'usuários utilizam'} este perfil.
									</small>
								{/if}
							</td>
							<td>{profile.userCount}</td>
							{#if canManage}
								<td>
									<div class="row-actions">
										<Button
											variant="outline"
											disabled={cannotEditRootProfile}
											aria-label={`Editar perfil ${profile.name}`}
											onclick={() => openEditor('edit', profile.source)}
										>
											Editar
										</Button>
										{#if cannotEditRootProfile}
											<small class="action-note">
												Sua sessão atual informa a função “{user.role}”. Apenas o Admin Root pode
												editar este perfil. O servidor continua sendo a autoridade final de
												autorização.
											</small>
										{/if}
										<Button
											variant="outline"
											disabled={!canDuplicate}
											title={!canDuplicate ? duplicateRestrictionMessage : undefined}
											aria-label={`Duplicar perfil ${profile.name}`}
											aria-describedby={!canDuplicate
												? `duplicate-guidance-${profile.id}`
												: undefined}
											onclick={() => openEditor('duplicate', profile.source)}
										>
											Duplicar
										</Button>
										<Button
											variant="outline-neutral"
											disabled={profile.isActive && (profile.isRoot || profile.userCount > 0)}
											title={statusRestrictionMessage || undefined}
											aria-label={`${profile.isActive ? 'Desativar' : 'Ativar'} perfil ${profile.name}`}
											aria-describedby={statusRestrictionMessage
												? `status-guidance-${profile.id}`
												: undefined}
											onclick={() => {
												clearSuccessMessage();
												pendingStatus = profile;
												statusError = '';
											}}
										>
											{profile.isActive ? 'Desativar' : 'Ativar'}
										</Button>
									</div>
									{#if !canDuplicate}
										<small id={`duplicate-guidance-${profile.id}`} class="action-note">
											{duplicateRestrictionMessage}
										</small>
									{/if}
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
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
	<Modal
		title={pendingStatus.isActive ? 'Desativar perfil' : 'Ativar perfil'}
		onclose={() => (pendingStatus = null)}
	>
		<div class="confirm-content">
			{#if pendingStatus.isActive && pendingStatus.isRoot}
				<p role="alert">O perfil Admin Root não pode ser desativado.</p>
			{:else if pendingStatus.isActive && pendingStatus.userCount > 0}
				<p role="alert">
					Este perfil não pode ser desativado enquanto {pendingStatus.userCount}
					{pendingStatus.userCount === 1 ? 'usuário estiver' : 'usuários estiverem'} associado(s).
				</p>
			{:else}
				<p>
					{pendingStatus.isActive
						? `Ao desativar, "${pendingStatus.name}" não poderá ser atribuído a usuários.`
						: `O perfil "${pendingStatus.name}" ficará disponível para atribuição.`}
					Confirmar?
				</p>
			{/if}
			{#if statusError}
				<p class="form-error" role="alert">{statusError}</p>
			{/if}
			<div class="modal-actions">
				<Button
					variant="outline-neutral"
					disabled={isChangingStatus}
					onclick={() => (pendingStatus = null)}
				>
					Cancelar
				</Button>
				{#if !(pendingStatus.isActive && (pendingStatus.isRoot || pendingStatus.userCount > 0))}
					<Button variant="primary" loading={isChangingStatus} onclick={confirmStatusChange}>
						{pendingStatus.isActive ? 'Desativar' : 'Ativar'}
					</Button>
				{/if}
			</div>
		</div>
	</Modal>
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
	.panel-header p,
	.description {
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
	.table-scroll {
		overflow-x: auto;
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}
	table {
		width: 100%;
		min-width: 880px;
		border-collapse: collapse;
	}
	th,
	td {
		padding: var(--spacing-sm) var(--spacing-md);
		border-bottom: var(--border-default);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		background: var(--background-color);
		color: var(--gray);
		font: var(--label);
		font-size: 11px;
		text-transform: uppercase;
	}
	tbody tr:last-child th,
	tbody tr:last-child td {
		border-bottom: 0;
	}
	tbody th {
		font-weight: 400;
	}
	.name-cell,
	.flags,
	.row-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}
	.name-cell strong {
		color: var(--heading-color);
	}
	.root-badge {
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--tint);
		color: var(--secondary-color);
		font: var(--label);
		font-size: 11px;
	}
	.description {
		display: block;
		margin-top: 4px;
		font-size: 12px;
	}
	.composition-count {
		display: block;
		font: var(--label);
	}
	.composition-list {
		display: block;
		max-width: 320px;
		margin-top: 4px;
		color: var(--gray);
		font-size: 12px;
		overflow-wrap: anywhere;
	}
	.flags {
		flex-wrap: wrap;
	}
	.flags span {
		padding: 3px 7px;
		border-radius: 999px;
		background: var(--background-color);
		color: var(--gray);
		font-size: 11px;
	}
	.flags span.enabled {
		background: var(--status-green-bg);
		color: var(--status-green);
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--gray);
		white-space: nowrap;
	}
	.status > span {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
	}
	.status.active {
		color: var(--status-green);
	}
	.status-note {
		display: block;
		max-width: 170px;
		margin-top: 4px;
		color: var(--status-red);
		font-size: 11px;
	}
	.row-actions {
		flex-wrap: wrap;
	}
	.row-actions :global(button) {
		padding: 6px 8px;
		font-size: 12px;
	}
	.action-note {
		display: block;
		max-width: 280px;
		margin-top: var(--spacing-xs);
		color: var(--gray);
		font-size: 11px;
	}
	.empty-state,
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
	.state.error,
	.form-error {
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
	.confirm-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
	.confirm-content p {
		margin: 0;
	}
	.form-error {
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		background: var(--status-error-bg);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
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
