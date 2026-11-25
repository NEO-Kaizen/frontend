<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Profile, ProfileKeyCatalog } from '$lib/types/profile';
	import type { SessionUser } from '$lib/types/auth';
	import { SELF_SERVICE_KEYS } from '$lib/types/permission';
	import type { Permission, PermissionCustody, PermissionKey } from '$lib/types/permission';
	import { createProfile, duplicateProfile, updateProfile } from '$lib/services/profile.service';
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
	} from './profile-editor.rules';

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

	// O payload de sessão ainda não expõe `isRoot`; a UI detecta Root pelo nome
	// do perfil (docs/profiles-api.md). Enquanto isso, renomear o Root desligaria
	// a autoridade, então a edição do nome fica bloqueada para ele.
	const isRootNameLocked = $derived(mode === 'edit' && profile?.isRoot === true);

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
	let compositionConfirmed = $state(false);
	let flagsConfirmed = $state(false);
	let identityConfirmed = $state(false);
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

	function validate(): boolean {
		const { nameError: nextNameError, saveError: nextSaveError } = validateProfileForm({
			mode,
			name,
			description,
			canEditComposition,
			missingDependencies,
			isAssignableTriage,
			isAssignableMapping,
			triageRequirementsMet,
			mappingRequirementsMet,
			unconfirmedSelfServiceKeys,
			compositionChanged,
			flagsChanged,
			identityChanged,
			compositionConfirmed,
			flagsConfirmed,
			identityConfirmed
		});
		nameError = nextNameError;
		saveError = nextSaveError;
		return !nameError && !saveError;
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
			handleSave();
		}}
	>
		<ProfileIdentityFields
			bind:name
			bind:description
			{nameError}
			disabled={isSaving}
			{isRootNameLocked}
			showDuplicateHelper={mode === 'duplicate'}
			onedit={() => (identityConfirmed = false)}
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
				oncompositionchange={() => (compositionConfirmed = false)}
			/>

			<ProfileAssignmentFlags
				bind:isAssignableTriage
				bind:isAssignableMapping
				{triageRequirementsMet}
				{mappingRequirementsMet}
				{isSaving}
				onflagschange={() => (flagsConfirmed = false)}
			/>
		{/if}

		{#if mode === 'edit' && identityChanged}
			<label class="section-confirmation">
				<input type="checkbox" bind:checked={identityConfirmed} disabled={isSaving} />
				Confirmo a alteração dos dados de identificação do perfil.
			</label>
		{/if}
		{#if mode === 'edit' && compositionChanged}
			<label class="section-confirmation">
				<input type="checkbox" bind:checked={compositionConfirmed} disabled={isSaving} />
				Confirmo a alteração da composição de permissões.
			</label>
		{/if}
		{#if mode === 'edit' && flagsChanged}
			<label class="section-confirmation">
				<input type="checkbox" bind:checked={flagsConfirmed} disabled={isSaving} />
				Confirmo a alteração das flags de atribuição.
			</label>
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
				disabled={mode === 'edit' && !identityChanged && !compositionChanged && !flagsChanged}
			>
				{mode === 'create'
					? 'Criar perfil'
					: mode === 'duplicate'
						? 'Duplicar perfil'
						: 'Salvar alterações'}
			</Button>
		</div>
	</form>
</Modal>

<style>
	.profile-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
	.section-confirmation {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		color: var(--black);
		font: var(--paragrafo);
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
