<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AssetImage from '$lib/components/AssetImage.svelte';
	import Button from '$lib/components/Button.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import { updateMyProfile } from '$lib/services/user.service';
	import type { UserProfileResponse } from '$lib/types/user';
	import { notifySectionSave } from '$lib/utils/feedback';
	import { resolveApiAssetUrl } from '$lib/utils/api-assets';
	import {
		isValidProfileAvatar,
		isValidText,
		PROFILE_FULL_NAME_MAX_LENGTH
	} from '$lib/utils/validations';
	import { requiredFieldError } from '../profile-validation';

	interface Props {
		profile: UserProfileResponse;
		onChanged: () => void | Promise<void>;
	}

	let { profile, onChanged }: Props = $props();

	const avatarUrl = $derived(resolveApiAssetUrl(profile.avatarUrl));
	const avatarLight = $derived(page.data.portalConfig.assets.avatarLightUrl);
	const avatarDark = $derived(page.data.portalConfig.assets.avatarDarkUrl);

	let fileInput = $state<HTMLInputElement>();
	let pendingFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let isUploading = $state(false);
	let avatarError = $state('');
	let isRemoveConfirmOpen = $state(false);
	let isEditingName = $state(false);
	let isSavingName = $state(false);
	let fullName = $state(untrack(() => profile.fullName));
	let fullNameError = $state('');

	function startNameEdit() {
		fullName = profile.fullName;
		fullNameError = '';
		isEditingName = true;
	}

	function cancelNameEdit() {
		fullName = profile.fullName;
		fullNameError = '';
		isEditingName = false;
	}

	async function saveName() {
		const trimmed = fullName.trim();
		fullNameError = requiredFieldError(trimmed, 'o nome completo', PROFILE_FULL_NAME_MAX_LENGTH);
		if (!fullNameError && !isValidText(trimmed)) {
			fullNameError = 'O nome deve conter apenas letras e espaços.';
		}
		if (fullNameError || isSavingName) return;

		isSavingName = true;
		const result = await updateMyProfile({ fullName: trimmed });
		isSavingName = false;

		if (!result.ok) {
			fullNameError = result.error.message;
			notifySectionSave({ ok: false, message: result.error.message });
			return;
		}

		fullName = result.data.fullName;
		isEditingName = false;
		notifySectionSave({ ok: true });
		await onChanged();
	}

	function revokePreview() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
	}

	function clearPending() {
		revokePreview();
		pendingFile = null;
		previewUrl = null;
		avatarError = '';
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		input.value = '';

		if (!file) return;

		if (!isValidProfileAvatar(file)) {
			avatarError = 'Use uma imagem JPG ou PNG de até 2MB.';
			return;
		}

		avatarError = '';
		revokePreview();
		pendingFile = file;
		previewUrl = URL.createObjectURL(file);
	}

	async function handleUpload() {
		if (!pendingFile || isUploading) return;

		isUploading = true;
		avatarError = '';

		const result = await updateMyProfile({ avatar: pendingFile });

		isUploading = false;

		if (!result.ok) {
			avatarError = result.error.message;
			return;
		}

		clearPending();
		await onChanged();
	}

	async function handleRemove() {
		isRemoveConfirmOpen = false;
		isUploading = true;
		avatarError = '';

		const result = await updateMyProfile({ removeAvatar: true });

		isUploading = false;

		if (!result.ok) {
			avatarError = result.error.message;
			return;
		}

		await onChanged();
	}

	onDestroy(revokePreview);
</script>

<article class="profile-card">
	<div class="identity-avatar">
		<div class="avatar-shell">
			<span class="avatar-frame">
				{#if previewUrl}
					<img src={previewUrl} alt="Pré-visualização da nova foto de perfil" />
				{:else if avatarUrl}
					<img src={avatarUrl} alt={`Foto de perfil de ${profile.fullName}`} />
				{:else}
					<AssetImage
						lightSrc={avatarLight}
						darkSrc={avatarDark}
						alt="Imagem de perfil padrão"
						width="100%"
						height="100%"
					/>
				{/if}
			</span>

			{#if avatarUrl && !pendingFile}
				<button
					type="button"
					class="avatar-remove"
					onclick={() => (isRemoveConfirmOpen = true)}
					disabled={isUploading}
					aria-label="Remover foto de perfil"
					title="Remover foto de perfil"
				>
					<Icon iconName="delete" iconSize="sm" />
				</button>
			{/if}
		</div>

		<div class="avatar-actions">
			<input
				bind:this={fileInput}
				class="sr-only"
				type="file"
				accept=".jpg,.jpeg,.png,image/jpeg,image/png"
				onchange={handleFileChange}
				aria-label="Selecionar nova foto de perfil"
			/>

			<Button variant="outline-neutral" onclick={() => fileInput?.click()} disabled={isUploading}>
				Trocar foto
			</Button>

			{#if pendingFile}
				<Button variant="primary" onclick={handleUpload} loading={isUploading}>Salvar foto</Button>

				<Button variant="outline-neutral" onclick={clearPending} disabled={isUploading}>
					Cancelar
				</Button>
			{/if}
		</div>

		<p class="avatar-hint">JPG ou PNG, até 2MB.</p>

		{#if avatarError}
			<p class="avatar-error" role="alert">{avatarError}</p>
		{/if}
	</div>

	<div class="identity-details">
		<div class="detail">
			<span class="detail-label">Nome completo</span>
			{#if isEditingName}
				<Input
					name="fullName"
					maxlength={PROFILE_FULL_NAME_MAX_LENGTH}
					bind:value={fullName}
					error={fullNameError}
					disabled={isSavingName}
				/>
				<div class="name-actions">
					<Button variant="primary" onclick={saveName} loading={isSavingName}>Salvar nome</Button>
					<Button variant="outline-neutral" onclick={cancelNameEdit} disabled={isSavingName}>
						Cancelar
					</Button>
				</div>
			{:else}
				<div class="name-display">
					<p>{fullName}</p>
					<button type="button" class="name-edit" onclick={startNameEdit}>Editar nome</button>
				</div>
			{/if}
		</div>

		<div class="detail">
			<span class="detail-label">E-mail</span>
			<p>{profile.email}</p>
		</div>

		<div class="detail">
			<span class="detail-label">Perfil</span>
			<p>{profile.role}</p>
		</div>

		<a class="password-link" href={resolve('/(app)/redefinir-senha')}>Alterar senha</a>
	</div>
</article>

<ConfirmDialog
	open={isRemoveConfirmOpen}
	title="Remover foto de perfil?"
	description="A imagem atual será excluída. Esta ação não pode ser desfeita."
	confirmLabel="Remover"
	onConfirm={handleRemove}
	onClose={() => (isRemoveConfirmOpen = false)}
/>

<style>
	.profile-card {
		width: 100%;
		box-sizing: border-box;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		box-shadow: var(--regular-shadow);
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-lg);
	}

	.identity-avatar {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		width: 220px;
	}

	.avatar-shell {
		position: relative;
		display: inline-flex;
	}

	.avatar-frame {
		display: inline-flex;
		width: 128px;
		height: 128px;
		border-radius: 100%;
		overflow: hidden;
		border: var(--border-default);
		flex-shrink: 0;
	}

	.avatar-frame :global(img),
	.avatar-frame :global(.asset-tint) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-remove {
		position: absolute;
		top: 0;
		right: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 100%;
		border: 2px solid var(--white);
		background-color: var(--status-error);
		color: var(--on-primary);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.avatar-remove:hover:not(:disabled) {
		filter: brightness(0.92);
	}

	.avatar-remove:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.avatar-remove:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.avatar-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--spacing-sm);
	}

	.avatar-hint {
		margin: 0;
		font: var(--label);
		font-size: 12px;
		color: var(--gray);
	}

	.avatar-error {
		margin: 0;
		color: var(--status-red);
		font: var(--label);
		font-size: 12px;
		text-align: center;
	}

	.identity-details {
		flex: 1;
		min-width: 240px;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
		align-content: start;
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.detail-label {
		font: var(--label);
		color: var(--gray);
	}

	.detail p {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
		word-break: break-word;
	}

	.name-display,
	.name-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.name-edit {
		padding: 0;
		border: none;
		background: none;
		color: var(--secondary-color);
		font: var(--label);
		cursor: pointer;
	}

	.name-edit:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.password-link {
		grid-column: 1 / -1;
		align-self: start;
		width: fit-content;
		color: var(--secondary-color);
		font: var(--label);
	}

	@media (max-width: 700px) {
		.identity-details {
			grid-template-columns: 1fr;
		}
	}
</style>
