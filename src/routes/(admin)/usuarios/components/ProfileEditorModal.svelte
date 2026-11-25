<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Profile, ProfileKeyCatalog } from '$lib/types/profile';
	import type { SessionUser } from '$lib/types/auth';
	import { SELF_SERVICE_KEYS } from '$lib/types/permission';
	import type { Permission, PermissionCustody, PermissionKey } from '$lib/types/permission';
	import { createProfile, duplicateProfile, updateProfile } from '$lib/services/profile.service';
	import { permissionLabel } from '$lib/services/profiles/permission-ui';
	import { custodyLabels } from '$lib/utils/profile-labels';
	import ProfileAssignmentFlags from './ProfileAssignmentFlags.svelte';
	import ProfileCompositionSection from './ProfileCompositionSection.svelte';
	import ProfileIdentityFields from './ProfileIdentityFields.svelte';
	import {
		actorCanGrant,
		buildPermissions,
		createProfilePayload,
		duplicateProfileName,
		findMissingDependencies,
		flagRequirementsMet,
		groupCatalogResources,
		permissionSignature,
		updateProfilePayload,
		validateProfileForm,
		type ProfileEditorMode,
		type SelfServiceKey
	} from '$lib/services/profiles/profile-editor.rules';

	interface Props {
		mode: ProfileEditorMode;
		profile: Profile | null;
		catalog: ProfileKeyCatalog;
		user: SessionUser;
		onclose: () => void;
		onsaved: (message: string, profile: Profile) => void;
	}

	let { mode, profile, catalog, user, onclose, onsaved }: Props = $props();

	const initialProfile = untrack(() => (profile && mode !== 'create' ? profile : null));

	let name = $state(
		untrack(() =>
			mode === 'duplicate' && initialProfile
				? duplicateProfileName(initialProfile.name)
				: (initialProfile?.name ?? '')
		)
	);
	let description = $state(initialProfile?.description ?? '');
	let selectedKeys = $state<PermissionKey[]>(
		initialProfile?.permissions.map((permission) => permission.key) ?? []
	);
	let selectedCustodies = $state<Partial<Record<PermissionKey, PermissionCustody>>>(
		Object.fromEntries(
			(initialProfile?.permissions ?? []).map((permission) => [permission.key, permission.custody])
		)
	);
	let isAssignableTriage = $state(initialProfile?.isAssignableTriage ?? false);
	let isAssignableMapping = $state(initialProfile?.isAssignableMapping ?? false);
	let removedSelfServiceConfirmed = $state<SelfServiceKey[]>([]);
	let confirmOpen = $state(false);
	let isSaving = $state(false);
	let saveError = $state('');
	let nameError = $state('');

	const resources = $derived(groupCatalogResources(catalog));
	const catalogKeys = $derived(resources.flatMap((resource) => resource.keys));
	const compositionLimit = $derived(catalog.permissions.length);

	const canEditComposition = $derived(
		mode !== 'edit' ||
			profile === null ||
			profile.permissions.every((permission) =>
				actorCanGrant(user, permission.key, permission.custody, catalog)
			)
	);

	function currentPermissions(): Permission[] {
		return profile?.permissions ?? [];
	}

	const builtPermissions = $derived(
		buildPermissions({
			selectedKeys,
			selectedCustodies,
			currentPermissions: currentPermissions(),
			user,
			catalog
		})
	);
	const missingDependencies = $derived(findMissingDependencies(catalogKeys, selectedKeys));
	const hasAssignedCustody = $derived(
		builtPermissions.some((permission) => permission.custody === 'assigned')
	);
	const removedSelfServiceKeys = $derived(
		SELF_SERVICE_KEYS.filter(
			(key) =>
				currentPermissions().some((permission) => permission.key === key) &&
				!selectedKeys.includes(key)
		)
	);
	const unconfirmedSelfServiceKeys = $derived(
		removedSelfServiceKeys.filter((key) => !removedSelfServiceConfirmed.includes(key))
	);
	const triageRequirementsMet = $derived(
		flagRequirementsMet(catalog, selectedKeys, 'isAssignableTriage')
	);
	const mappingRequirementsMet = $derived(
		flagRequirementsMet(catalog, selectedKeys, 'isAssignableMapping')
	);
	const compositionChanged = $derived(
		canEditComposition &&
			permissionSignature(currentPermissions()) !== permissionSignature(builtPermissions)
	);
	const flagsChanged = $derived.by(() => {
		return (
			isAssignableTriage !== (profile?.isAssignableTriage ?? false) ||
			isAssignableMapping !== (profile?.isAssignableMapping ?? false)
		);
	});
	const identityChanged = $derived.by(() => {
		return (
			name.trim() !== (profile?.name ?? '') || description.trim() !== (profile?.description ?? '')
		);
	});
	const hasPendingChanges = $derived(identityChanged || compositionChanged || flagsChanged);
	const addedKeys = $derived(
		selectedKeys.filter((key) => !currentPermissions().some((permission) => permission.key === key))
	);
	const removedKeys = $derived(
		currentPermissions()
			.filter((permission) => !selectedKeys.includes(permission.key))
			.map((permission) => permission.key)
	);
	const custodyChanges = $derived.by(() => {
		const previousCustodies = new Map(
			currentPermissions().map((permission) => [permission.key, permission.custody])
		);
		return builtPermissions.flatMap((permission) => {
			const previous = previousCustodies.get(permission.key);
			return previous && previous !== permission.custody
				? [
						`${permissionLabel(permission.key)}: ${custodyLabels[previous]} → ${custodyLabels[permission.custody]}`
					]
				: [];
		});
	});
	const flagChanges = $derived.by(() => {
		const changes: string[] = [];
		if (isAssignableTriage !== (profile?.isAssignableTriage ?? false)) {
			changes.push(`Triagem: ${isAssignableTriage ? 'ligada' : 'desligada'}`);
		}
		if (isAssignableMapping !== (profile?.isAssignableMapping ?? false)) {
			changes.push(`Mapeamento: ${isAssignableMapping ? 'ligada' : 'desligada'}`);
		}
		return changes;
	});

	function validate(): boolean {
		const { nameError: nextNameError, saveError: nextSaveError } = validateProfileForm({
			mode,
			name,
			description,
			canEditComposition,
			missingDependencies,
			isAssignableTriage,
			isAssignableMapping,
			hasAssignedCustody,
			triageRequirementsMet,
			mappingRequirementsMet,
			unconfirmedSelfServiceKeys
		});
		nameError = nextNameError;
		saveError = nextSaveError;
		return !nameError && !saveError;
	}

	function requestSave(): void {
		if (isSaving || !validate()) return;
		if (mode === 'edit' && hasPendingChanges) {
			confirmOpen = true;
			return;
		}
		void handleSave();
	}

	async function handleSave() {
		if (isSaving || !validate()) return;
		isSaving = true;
		saveError = '';
		if (mode === 'duplicate' && profile) {
			const result = await duplicateProfile(profile.id, {
				name: name.trim(),
				description: description.trim() || null
			});
			isSaving = false;
			if (!result.ok) {
				saveError = result.error.message;
				return;
			}
			onsaved(`Perfil "${name.trim()}" duplicado com sucesso.`, result.data);
			return;
		}

		if (mode === 'create') {
			const result = await createProfile(
				createProfilePayload({
					name,
					description,
					permissions: builtPermissions,
					isAssignableTriage,
					isAssignableMapping
				})
			);
			isSaving = false;
			if (!result.ok) {
				saveError = result.error.message;
				return;
			}
			onsaved(`Perfil "${name.trim()}" criado com sucesso.`, result.data);
			return;
		}

		if (!profile) {
			isSaving = false;
			saveError = 'Não foi possível identificar o perfil para edição.';
			return;
		}
		const result = await updateProfile(
			profile.id,
			updateProfilePayload({
				profile,
				name,
				description,
				permissions: builtPermissions,
				compositionChanged,
				canEditComposition,
				isAssignableTriage,
				isAssignableMapping
			})
		);
		isSaving = false;
		if (!result.ok) {
			saveError = result.error.message;
			return;
		}
		onsaved(`Perfil "${name.trim()}" atualizado com sucesso.`, result.data);
	}

	const title = $derived(
		mode === 'create' ? 'Criar perfil' : mode === 'duplicate' ? 'Duplicar perfil' : 'Editar perfil'
	);
</script>

<Modal {title} {onclose} size="lg">
	<form
		class="profile-form"
		onsubmit={(event) => {
			event.preventDefault();
			requestSave();
		}}
	>
		<ProfileIdentityFields
			bind:name
			bind:description
			{nameError}
			disabled={isSaving}
			showDuplicateHelper={mode === 'duplicate'}
		/>

		{#if mode !== 'duplicate'}
			<ProfileCompositionSection
				{resources}
				{catalog}
				{user}
				{canEditComposition}
				isCompositionLocked={mode === 'edit' && !canEditComposition}
				{compositionLimit}
				{isSaving}
				{missingDependencies}
				{removedSelfServiceKeys}
				bind:selectedKeys
				bind:selectedCustodies
				bind:removedSelfServiceConfirmed
			/>

			<ProfileAssignmentFlags
				bind:isAssignableTriage
				bind:isAssignableMapping
				{hasAssignedCustody}
				{triageRequirementsMet}
				{mappingRequirementsMet}
				{isSaving}
			/>
		{/if}

		{#if saveError}
			<p class="form-error" role="alert">{saveError}</p>
		{/if}
		<div class="modal-actions">
			<Button variant="outline-neutral" disabled={isSaving} onclick={onclose}>Cancelar</Button>
			<Button
				type="submit"
				variant="primary"
				loading={isSaving}
				disabled={mode === 'edit' && !hasPendingChanges}
			>
				{mode === 'create'
					? 'Criar perfil'
					: mode === 'duplicate'
						? 'Duplicar perfil'
						: 'Salvar alterações'}
			</Button>
		</div>
	</form>

	<ConfirmDialog
		open={confirmOpen}
		title="Confirmar alterações do perfil"
		description="Revise o que será alterado antes de salvar."
		confirmLabel="Salvar alterações"
		onConfirm={() => {
			confirmOpen = false;
			void handleSave();
		}}
		onClose={() => (confirmOpen = false)}
	>
		{#snippet details()}
			<ul class="change-list">
				{#if identityChanged}
					<li>
						<strong>Identificação</strong>
						<ul>
							{#if name.trim() !== (profile?.name ?? '')}
								<li>Nome: “{profile?.name ?? ''}” → “{name.trim()}”</li>
							{/if}
							{#if description.trim() !== (profile?.description ?? '')}
								<li>Descrição alterada</li>
							{/if}
						</ul>
					</li>
				{/if}
				{#if compositionChanged}
					<li>
						<strong>Composição</strong>
						<ul>
							<li>{builtPermissions.length} permissões selecionadas</li>
							{#if addedKeys.length > 0}
								<li>Incluídas: {addedKeys.join(', ')}</li>
							{/if}
							{#if removedKeys.length > 0}
								<li>Removidas: {removedKeys.join(', ')}</li>
							{/if}
							{#if custodyChanges.length > 0}
								<li>Escopo alterado: {custodyChanges.join('; ')}</li>
							{/if}
						</ul>
					</li>
				{/if}
				{#if flagsChanged}
					<li>
						<strong>Atribuição</strong>
						<ul>
							{#each flagChanges as change (change)}
								<li>{change}</li>
							{/each}
						</ul>
					</li>
				{/if}
			</ul>
		{/snippet}
	</ConfirmDialog>
</Modal>

<style>
	.profile-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
	.change-list,
	.change-list ul {
		margin: 0;
		padding-left: 18px;
		color: var(--black);
		font: var(--paragrafo);
	}
	.change-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}
	.change-list strong {
		color: var(--heading-color);
		font: var(--label);
	}
	.form-error {
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--status-error-bg);
		color: var(--status-red);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}
</style>
