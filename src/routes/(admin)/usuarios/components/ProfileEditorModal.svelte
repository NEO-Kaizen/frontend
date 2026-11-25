<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type {
		Profile,
		ProfileCreateInput,
		ProfileKeyCatalog,
		ProfileUpdateInput
	} from '$lib/types/profile';
	import type { SessionUser } from '$lib/types/auth';
	import { SELF_SERVICE_KEYS } from '$lib/types/permission';
	import type { Permission, PermissionCustody, PermissionKey } from '$lib/types/permission';
	import { createProfile, duplicateProfile, updateProfile } from '$lib/services/profile.service';
	import { canGrantCustody } from '$lib/utils/permission-checks';
	import { PROFILE_DESCRIPTION_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH } from '$lib/utils/validations';

	interface Props {
		mode: 'create' | 'edit' | 'duplicate';
		profile: Profile | null;
		catalog: ProfileKeyCatalog;
		user: SessionUser;
		onclose: () => void;
		onsaved: (message: string, profile: Profile) => void;
	}

	type CatalogKey = {
		key: PermissionKey;
		label: string;
		fixedCustody: PermissionCustody | null;
		custodies: PermissionCustody[];
		dependencies: PermissionKey[];
	};

	type CatalogResource = { id: string; label: string; keys: CatalogKey[] };

	const custodyLabels: Record<PermissionCustody, string> = {
		global: 'Global',
		own: 'Próprio',
		assigned: 'Atribuído',
		all: 'Todos'
	};
	const selfServiceKeySet = new Set<string>(SELF_SERVICE_KEYS);
	const selfServiceKeys = SELF_SERVICE_KEYS;
	type SelfServiceKey = (typeof SELF_SERVICE_KEYS)[number];

	function isSelfServiceKey(key: PermissionKey): key is SelfServiceKey {
		return selfServiceKeySet.has(key);
	}

	let { mode, profile, catalog, user, onclose, onsaved }: Props = $props();

	const initialProfile = untrack(() => (profile && mode !== 'create' ? profile : null));

	// O payload de sessão ainda não expõe `isRoot`; a UI detecta Root pelo nome
	// do perfil (docs/profiles-api.md). Enquanto isso, renomear o Root desligaria
	// a autoridade, então a edição do nome fica bloqueada para ele.
	const isRootNameLocked = $derived(mode === 'edit' && profile?.isRoot === true);

	function duplicateProfileName(value: string): string {
		const suffix = ' (cópia)';
		return `${value.trim().slice(0, PROFILE_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
	}

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
	let dependencyGuidance = $state('');
	let isSaving = $state(false);
	let saveError = $state('');
	let nameError = $state('');

	function humanizePermission(value: string): string {
		return value
			.split(':')
			.map((part) => part.replace(/_/g, ' '))
			.join(' · ')
			.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
	}

	function catalogResources(): CatalogResource[] {
		const grouped: Record<string, CatalogKey[]> = {};
		for (const definition of catalog.permissions) {
			const resource = humanizePermission(definition.key.split(':')[0] || 'Permissões');
			const allowedCustodies = definition.allowedCustodies;
			const fixedCustody =
				definition.custodyType === 'global'
					? 'global'
					: allowedCustodies.length === 1
						? (allowedCustodies[0] ?? null)
						: null;
			const normalized: CatalogKey = {
				key: definition.key,
				label: humanizePermission(definition.key),
				fixedCustody,
				custodies: [...allowedCustodies],
				dependencies: [...definition.dependencies]
			};
			grouped[resource] = [...(grouped[resource] ?? []), normalized];
		}
		return Object.entries(grouped).map(([label, keys]) => ({ id: label, label, keys }));
	}

	const resources = $derived(catalogResources());
	const catalogKeys = $derived(resources.flatMap((resource) => resource.keys));
	const compositionLimit = $derived(catalog.permissions.length);
	const selfServiceConsequences: Record<SelfServiceKey, string> = {
		'request:create': 'a pessoa perderá a capacidade de abrir novas solicitações.',
		'request:track': 'a pessoa perderá a capacidade de acompanhar as próprias solicitações.',
		'pending_item:respond': 'a pessoa não poderá responder a pedidos de informação pendente.'
	};

	function grantableCustodies(key: PermissionKey): PermissionCustody[] {
		const entry = catalogKeys.find((item) => item.key === key);
		const allowedCustodies = entry?.custodies ?? [];
		return allowedCustodies.filter((custody) =>
			user.permissions.some(
				(permission) => permission.key === key && canGrantCustody(permission.custody, custody)
			)
		);
	}

	function actorCanGrant(key: PermissionKey, custody?: PermissionCustody): boolean {
		const availableCustodies = grantableCustodies(key);
		return custody ? availableCustodies.includes(custody) : availableCustodies.length > 0;
	}

	const canEditComposition = $derived(
		mode !== 'edit' ||
			profile === null ||
			profile.permissions.every((permission) => actorCanGrant(permission.key, permission.custody))
	);

	function currentPermissions(): Permission[] {
		return profile?.permissions ?? [];
	}

	function findFlagRequirements(
		name: 'isAssignableTriage' | 'isAssignableMapping'
	): PermissionKey[] {
		return name === 'isAssignableTriage'
			? catalog.assignabilityPredicates.triage
			: catalog.assignabilityPredicates.mapping;
	}

	function flagRequirementsMet(name: 'isAssignableTriage' | 'isAssignableMapping'): boolean {
		return findFlagRequirements(name).every((key) => selectedKeys.includes(key));
	}

	const missingDependencies = $derived(
		catalogKeys.flatMap((entry) =>
			selectedKeys.includes(entry.key)
				? entry.dependencies
						.filter((dependency) => !selectedKeys.includes(dependency))
						.map((dependency) => ({ key: entry.key, dependency }))
				: []
		)
	);
	const removedSelfServiceKeys = $derived(
		selfServiceKeys.filter(
			(key) =>
				currentPermissions().some((permission) => permission.key === key) &&
				!selectedKeys.includes(key)
		)
	);
	const unconfirmedSelfServiceKeys = $derived(
		removedSelfServiceKeys.filter((key) => !removedSelfServiceConfirmed.includes(key))
	);
	const compositionChanged = $derived(
		canEditComposition &&
			permissionSignature(currentPermissions()) !== permissionSignature(buildPermissions())
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

	function buildPermissions(): Permission[] {
		const existing = currentPermissions();
		return selectedKeys.map((key) => {
			const current = existing.find((permission) => permission.key === key);
			const entry = catalogKeys.find((item) => item.key === key);
			const custody: PermissionCustody =
				(Object.hasOwn(selectedCustodies, key) ? selectedCustodies[key] : current?.custody) ??
				entry?.fixedCustody ??
				grantableCustodies(key)[0] ??
				'global';
			return { key, custody };
		});
	}

	function permissionSignature(permissions: readonly Permission[]): string {
		return permissions
			.map((permission) => `${permission.key}:${permission.custody}`)
			.sort()
			.join('|');
	}

	function setKeySelected(key: PermissionKey, checked: boolean) {
		if (!checked) {
			const dependents = catalogKeys
				.filter((entry) => selectedKeys.includes(entry.key) && entry.dependencies.includes(key))
				.map((entry) => entry.key);
			if (dependents.length > 0) {
				dependencyGuidance = `Desmarque primeiro as permissões dependentes: ${dependents.join(', ')}.`;
				return;
			}
		}

		dependencyGuidance = '';
		compositionConfirmed = false;
		selectedKeys = checked
			? [...new Set([...selectedKeys, key])]
			: selectedKeys.filter((item) => item !== key);
		removedSelfServiceConfirmed = removedSelfServiceConfirmed.filter((item) => item !== key);
	}

	function validate(): boolean {
		nameError = '';
		saveError = '';
		if (!name.trim()) nameError = 'Informe o nome do perfil.';
		else if (name.trim().length > PROFILE_NAME_MAX_LENGTH) {
			nameError = `O nome deve ter no máximo ${PROFILE_NAME_MAX_LENGTH} caracteres.`;
		}
		if (description.trim().length > PROFILE_DESCRIPTION_MAX_LENGTH) {
			saveError = `A descrição deve ter no máximo ${PROFILE_DESCRIPTION_MAX_LENGTH} caracteres.`;
		} else if (mode !== 'duplicate') {
			if (canEditComposition && missingDependencies.length > 0) {
				saveError = 'Resolva as dependências faltantes antes de salvar.';
			} else if (
				canEditComposition &&
				((isAssignableTriage && !flagRequirementsMet('isAssignableTriage')) ||
					(isAssignableMapping && !flagRequirementsMet('isAssignableMapping')))
			) {
				const blockedFlags = [
					isAssignableTriage && !flagRequirementsMet('isAssignableTriage') ? 'triagem' : null,
					isAssignableMapping && !flagRequirementsMet('isAssignableMapping') ? 'mapeamento' : null
				].filter(Boolean);
				saveError = `Desligue a flag de ${blockedFlags.join(' e ')} para remover as chaves que ela exige, tudo na mesma edição.`;
			} else if (canEditComposition && unconfirmedSelfServiceKeys.length > 0) {
				saveError = 'Confirme as consequências de remover as permissões de autoatendimento.';
			} else if (
				mode === 'edit' &&
				((compositionChanged && !compositionConfirmed) ||
					(flagsChanged && !flagsConfirmed) ||
					(identityChanged && !identityConfirmed))
			) {
				saveError = 'Confirme cada seção alterada antes de salvar.';
			}
		}
		return !nameError && !saveError;
	}

	function createPayload(): ProfileCreateInput {
		return {
			name: name.trim(),
			description: description.trim() || undefined,
			permissions: buildPermissions(),
			isAssignableTriage,
			isAssignableMapping
		};
	}

	function updatePayload(): ProfileUpdateInput {
		const payload: ProfileUpdateInput = {};
		if (name.trim() !== (profile?.name ?? '')) payload.name = name.trim();
		if (description.trim() !== (profile?.description ?? '')) {
			payload.description = description.trim() || null;
		}
		// Composição e flags permanecem juntas no PATCH quando ambas mudam (guarda 6).
		if (compositionChanged && canEditComposition) {
			payload.permissions = buildPermissions();
		}
		if (isAssignableTriage !== (profile?.isAssignableTriage ?? false)) {
			payload.isAssignableTriage = isAssignableTriage;
		}
		if (isAssignableMapping !== (profile?.isAssignableMapping ?? false)) {
			payload.isAssignableMapping = isAssignableMapping;
		}
		return payload;
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
			const result = await createProfile(createPayload());
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
		const result = await updateProfile(profile.id, updatePayload());
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
		{#if mode === 'duplicate'}
			<p class="helper">
				A cópia herda a composição e as flags do perfil de origem; você pode alterar o nome e a
				descrição.
			</p>
		{/if}
		<div class="form-row">
			<Input
				label="Nome do perfil *"
				maxlength={PROFILE_NAME_MAX_LENGTH}
				required
				bind:value={name}
				oninput={() => (identityConfirmed = false)}
				error={nameError}
				disabled={isSaving || isRootNameLocked}
			/>
			<label class="field">
				<span>Descrição</span>
				<textarea
					bind:value={description}
					maxlength={PROFILE_DESCRIPTION_MAX_LENGTH}
					rows="2"
					disabled={isSaving}
					oninput={() => (identityConfirmed = false)}></textarea>
			</label>
		</div>

		{#if isRootNameLocked}
			<p class="helper">
				O nome do perfil Root não pode ser alterado enquanto a sessão não expuser
				<code>isRoot</code>.
			</p>
		{/if}

		{#if mode !== 'duplicate'}
			<section class="form-section" aria-labelledby="composition-title">
				<div class="section-heading">
					<div>
						<h4 id="composition-title">Composição de permissões</h4>
						<p>
							Selecione até {compositionLimit} permissões. As permissões que sua conta não possui ficam
							bloqueadas e não podem ser concedidas.
						</p>
					</div>
					<span class="composition-limit">
						{selectedKeys.length}/{compositionLimit}
					</span>
				</div>
				{#if mode === 'edit' && !canEditComposition}
					<p class="composition-lock-note" role="note">
						A composição está bloqueada porque sua conta não pode conceder todas as permissões deste
						perfil. Você ainda pode alterar o nome, a descrição e as flags de atribuição.
					</p>
				{/if}
				{#each resources as resource (resource.id)}
					<fieldset class="resource-group">
						<legend>{resource.label}</legend>
						{#each resource.keys as entry (entry.key)}
							{@const checked = selectedKeys.includes(entry.key)}
							{@const availableCustodies = grantableCustodies(entry.key)}
							{@const canGrant = availableCustodies.length > 0}
							{@const missingForKey = entry.dependencies.filter(
								(dependency) => !selectedKeys.includes(dependency)
							)}
							{@const custodySelector =
								checked && !entry.fixedCustody && availableCustodies.length > 1}
							<div
								class={[
									'permission-row',
									{
										blocked:
											!canGrant || !canEditComposition || (!checked && missingForKey.length > 0)
									}
								]}
							>
								<label class="permission-choice">
									<input
										type="checkbox"
										{checked}
										disabled={isSaving ||
											!canGrant ||
											!canEditComposition ||
											(!checked && missingForKey.length > 0) ||
											(!checked && selectedKeys.length >= compositionLimit)}
										onchange={(event) => setKeySelected(entry.key, event.currentTarget.checked)}
									/>
									<span>
										<strong>{entry.label}</strong>
										<code>{entry.key}</code>
										{#if !canGrant}
											<small class="blocked-note">
												Sua conta não possui a permissão e o escopo necessários para concedê-la.
											</small>
										{/if}
										{#if !checked && missingForKey.length > 0}
											<small class="blocked-note">
												Inclua primeiro: {missingForKey.join(', ')}.
											</small>
										{/if}
									</span>
								</label>
								{#if custodySelector}
									<label class="custody-field">
										<span>Escopo</span>
										<select
											aria-label={`Escopo de ${entry.key}`}
											value={selectedCustodies[entry.key] ?? availableCustodies[0]}
											disabled={isSaving || !canEditComposition}
											onchange={(event) => {
												const custody = availableCustodies.find(
													(availableCustody) => availableCustody === event.currentTarget.value
												);
												if (!custody) return;

												compositionConfirmed = false;
												selectedCustodies = {
													...selectedCustodies,
													[entry.key]: custody
												};
											}}
										>
											{#each availableCustodies as custody (custody)}
												<option value={custody}>{custodyLabels[custody]}</option>
											{/each}
										</select>
									</label>
								{:else if checked && entry.fixedCustody}
									<span class="fixed-custody">Escopo fixo: {entry.fixedCustody}</span>
								{/if}
								{#if checked && isSelfServiceKey(entry.key)}
									<span class="self-service-note">Autoatendimento</span>
								{/if}
							</div>
						{/each}
					</fieldset>
				{:else}
					<p class="catalog-empty">O catálogo não contém permissões disponíveis.</p>
				{/each}

				{#if dependencyGuidance}
					<p class="dependency-guidance" role="status">{dependencyGuidance}</p>
				{/if}

				{#if missingDependencies.length > 0}
					<div class="dependency-error" role="alert">
						<strong>Dependências faltantes</strong>
						<ul>
							{#each missingDependencies as missing, index (`${missing.key}-${missing.dependency}-${index}`)}
								<li>{missing.key} exige {missing.dependency}.</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if removedSelfServiceKeys.length > 0}
					<div class="self-service-confirmations">
						<strong>Confirme as consequências de remover permissões de autoatendimento</strong>
						{#each removedSelfServiceKeys as key (key)}
							<label>
								<input
									type="checkbox"
									checked={removedSelfServiceConfirmed.includes(key)}
									disabled={isSaving}
									onchange={(event) => {
										removedSelfServiceConfirmed = event.currentTarget.checked
											? [...removedSelfServiceConfirmed, key]
											: removedSelfServiceConfirmed.filter((item) => item !== key);
									}}
								/>
								<span
									>Confirmo que ao remover <code>{key}</code>, {selfServiceConsequences[key]}</span
								>
							</label>
						{/each}
					</div>
				{/if}
			</section>

			<section class="form-section" aria-labelledby="flags-title">
				<div class="section-heading">
					<div>
						<h4 id="flags-title">Disponibilidade para atribuição</h4>
						<p>As opções seguem os predicados definidos no catálogo de permissões.</p>
					</div>
				</div>
				<label class="flag-choice">
					<input
						type="checkbox"
						bind:checked={isAssignableTriage}
						onchange={() => (flagsConfirmed = false)}
						disabled={isSaving ||
							(!flagRequirementsMet('isAssignableTriage') && !isAssignableTriage)}
					/>
					<span>
						<strong>Atribuível à triagem</strong>
						{#if !flagRequirementsMet('isAssignableTriage')}
							<small>Inclua as permissões exigidas pelo catálogo para habilitar esta opção.</small>
						{/if}
					</span>
				</label>
				<label class="flag-choice">
					<input
						type="checkbox"
						bind:checked={isAssignableMapping}
						onchange={() => (flagsConfirmed = false)}
						disabled={isSaving ||
							(!flagRequirementsMet('isAssignableMapping') && !isAssignableMapping)}
					/>
					<span>
						<strong>Atribuível ao mapeamento</strong>
						{#if !flagRequirementsMet('isAssignableMapping')}
							<small>Inclua as permissões exigidas pelo catálogo para habilitar esta opção.</small>
						{/if}
					</span>
				</label>
			</section>
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
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		color: var(--heading-color);
		font: var(--label);
	}
	.field textarea,
	select {
		width: 100%;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
		color: var(--black);
		font: var(--paragrafo);
	}
	.field textarea:focus,
	select:focus {
		outline: 2px solid var(--secondary-color);
		outline-offset: 1px;
	}
	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}
	.section-heading h4 {
		margin: 0 0 4px;
		color: var(--heading-color);
		font: var(--h4);
	}
	.section-heading p,
	.helper {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
	}
	.resource-group {
		min-width: 0;
		margin: 0;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}
	.resource-group legend {
		padding: 0 6px;
		color: var(--heading-color);
		font: var(--label);
	}
	.permission-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) 0;
		border-bottom: var(--border-default);
	}
	.permission-row:last-child {
		border-bottom: 0;
	}
	.permission-choice,
	.flag-choice {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		min-width: 0;
		cursor: pointer;
	}
	.permission-choice > span,
	.flag-choice > span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.permission-choice strong,
	.flag-choice strong {
		color: var(--black);
		font: var(--label);
	}
	.permission-choice code,
	.self-service-confirmations code {
		color: var(--secondary-color);
		font-size: 11px;
	}
	.permission-choice small,
	.flag-choice small {
		color: var(--gray);
		font-size: 12px;
	}
	.permission-row.blocked {
		background: var(--background-color);
	}
	.permission-row.blocked .permission-choice {
		cursor: not-allowed;
	}
	.permission-choice .blocked-note {
		color: var(--status-red);
	}
	.composition-lock-note,
	.dependency-guidance {
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--background-color);
		color: var(--gray);
	}
	.dependency-guidance {
		border: 1px solid var(--status-orange);
		color: var(--heading-color);
	}
	.custody-field {
		display: flex;
		flex-shrink: 0;
		flex-direction: column;
		gap: 3px;
		color: var(--gray);
		font-size: 11px;
	}
	.custody-field select {
		min-width: 110px;
		padding: 5px 7px;
		font-size: 12px;
	}
	.fixed-custody,
	.self-service-note {
		flex-shrink: 0;
		color: var(--gray);
		font-size: 11px;
	}
	.self-service-note {
		color: var(--secondary-color);
	}
	.dependency-error,
	.form-error {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--status-error-bg);
		color: var(--status-red);
	}
	.dependency-error ul {
		margin: var(--spacing-xs) 0 0;
		padding-left: 20px;
	}
	.self-service-confirmations {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		border: 1px solid var(--status-orange);
		border-radius: var(--radius-sm);
	}
	.self-service-confirmations strong {
		color: var(--heading-color);
		font: var(--label);
	}
	.self-service-confirmations label,
	.section-confirmation {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		color: var(--black);
		font: var(--paragrafo);
	}
	.catalog-empty {
		margin: 0;
		color: var(--gray);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}
	.form-error {
		margin: 0;
	}
	@media (max-width: 620px) {
		.form-row {
			grid-template-columns: 1fr;
		}
		.permission-row {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
