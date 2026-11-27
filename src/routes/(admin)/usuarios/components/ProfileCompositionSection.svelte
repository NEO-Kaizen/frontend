<script lang="ts">
	import { untrack } from 'svelte';
	import type { SessionUser } from '$lib/types/auth';
	import type { PermissionCustody, PermissionKey } from '$lib/types/permission';
	import { custodyLabels } from '$lib/utils/profile-labels';
	import type { ProfileKeyCatalog } from '$lib/types/profile';
	import { permissionLabel } from '$lib/services/profiles/permission-ui';
	import {
		SELF_SERVICE_CONSEQUENCES,
		dependentsOf,
		expandWithDependencies,
		grantableCustodies,
		isSelfServiceKey,
		ungrantableDependencies,
		type CatalogResource,
		type MissingDependency,
		type SelfServiceKey
	} from '$lib/services/profiles/profile-editor.rules';

	interface Props {
		resources: CatalogResource[];
		catalog: ProfileKeyCatalog;
		user: SessionUser;
		canEditComposition: boolean;
		isCompositionLocked: boolean;
		compositionLimit: number;
		isSaving: boolean;
		missingDependencies: readonly MissingDependency[];
		removedSelfServiceKeys: readonly SelfServiceKey[];
		selectedKeys?: PermissionKey[];
		selectedCustodies?: Partial<Record<PermissionKey, PermissionCustody>>;
		removedSelfServiceConfirmed?: SelfServiceKey[];
		oncompositionchange?: () => void;
	}

	let {
		resources,
		catalog,
		user,
		canEditComposition,
		isCompositionLocked,
		compositionLimit,
		isSaving,
		missingDependencies,
		removedSelfServiceKeys,
		selectedKeys = $bindable([]),
		selectedCustodies = $bindable({}),
		removedSelfServiceConfirmed = $bindable([]),
		oncompositionchange
	}: Props = $props();

	const catalogKeys = $derived(resources.flatMap((resource) => resource.keys));
	const keyToResourceId = $derived.by(() => {
		const map: Partial<Record<PermissionKey, string>> = {};
		for (const resource of resources) {
			for (const entry of resource.keys) map[entry.key] = resource.id;
		}
		return map;
	});

	// Abre os grupos que já têm seleção; sem seleção, abre o primeiro.
	let openGroups = $state<Record<string, boolean>>(
		untrack(() => initialOpenGroups(resources, selectedKeys))
	);
	let dependencyFeedback = $state('');

	const selectedGroupCount = $derived(
		resources.filter((resource) => resource.keys.some((entry) => selectedKeys.includes(entry.key)))
			.length
	);

	function initialOpenGroups(
		groups: readonly CatalogResource[],
		keys: readonly PermissionKey[]
	): Record<string, boolean> {
		const anySelected = groups.some((group) =>
			group.keys.some((entry) => keys.includes(entry.key))
		);
		const state: Record<string, boolean> = {};
		groups.forEach((group, index) => {
			state[group.id] =
				group.keys.some((entry) => keys.includes(entry.key)) || (!anySelected && index === 0);
		});
		return state;
	}

	function toggleGroup(id: string, open: boolean): void {
		openGroups[id] = open;
	}

	function expandAll(): void {
		openGroups = Object.fromEntries(resources.map((resource) => [resource.id, true]));
	}

	function collapseAll(): void {
		openGroups = Object.fromEntries(resources.map((resource) => [resource.id, false]));
	}

	function openGroupsFor(keys: readonly PermissionKey[]): void {
		const next = { ...openGroups };
		for (const key of keys) {
			const resourceId = keyToResourceId[key];
			if (resourceId) next[resourceId] = true;
		}
		openGroups = next;
	}

	function setKeySelected(key: PermissionKey, checked: boolean): void {
		if (!checked) {
			const dependents = dependentsOf(key, selectedKeys, catalogKeys);
			if (dependents.length > 0) {
				dependencyFeedback = `Remova primeiro as permissões que exigem ${permissionLabel(key)}: ${dependents
					.map(permissionLabel)
					.join(', ')}.`;
				return;
			}

			dependencyFeedback = '';
			oncompositionchange?.();
			selectedKeys = selectedKeys.filter((item) => item !== key);
			removedSelfServiceConfirmed = removedSelfServiceConfirmed.filter((item) => item !== key);
			return;
		}

		const blockedDependencies = ungrantableDependencies(user, key, catalog);
		if (blockedDependencies.length > 0) {
			dependencyFeedback = `Não é possível incluir ${permissionLabel(key)}: sua conta não pode conceder ${blockedDependencies
				.map(permissionLabel)
				.join(', ')}.`;
			return;
		}

		const nextKeys = expandWithDependencies([...selectedKeys, key], catalogKeys);
		const included = nextKeys.filter(
			(candidate) => candidate !== key && !selectedKeys.includes(candidate)
		);

		oncompositionchange?.();
		selectedKeys = nextKeys;
		removedSelfServiceConfirmed = removedSelfServiceConfirmed.filter((item) => item !== key);

		if (included.length > 0) {
			openGroupsFor(included);
			dependencyFeedback = `Incluímos automaticamente: ${included.map(permissionLabel).join(', ')}.`;
		} else {
			dependencyFeedback = '';
		}
	}
</script>

<section class="form-section" aria-labelledby="composition-title">
	<div class="section-heading">
		<div>
			<h4 id="composition-title">Composição de permissões</h4>
			<p>
				Selecione até {compositionLimit} permissões. As permissões que sua conta não possui ficam bloqueadas
				e não podem ser concedidas.
			</p>
		</div>
		<span class="composition-limit">
			{selectedKeys.length}/{compositionLimit}
		</span>
	</div>
	<p class="composition-summary">
		{selectedKeys.length}/{compositionLimit} permissões em {selectedGroupCount} grupos
	</p>
	{#if isCompositionLocked}
		<p class="composition-lock-note" role="note">
			A composição está bloqueada porque sua conta não pode conceder todas as permissões deste
			perfil. Você ainda pode alterar o nome, a descrição e as flags de atribuição.
		</p>
	{/if}
	<div class="group-controls">
		<button type="button" class="link-button" onclick={expandAll}>Expandir todos</button>
		<button type="button" class="link-button" onclick={collapseAll}>Recolher todos</button>
	</div>
	{#each resources as resource (resource.id)}
		{@const selectedCount = resource.keys.filter((entry) =>
			selectedKeys.includes(entry.key)
		).length}
		<details
			class={['resource-group', { 'has-selection': selectedCount > 0 }]}
			open={openGroups[resource.id] ?? false}
			ontoggle={(event) => toggleGroup(resource.id, event.currentTarget.open)}
		>
			<summary
				class="resource-summary"
				aria-label={`${resource.label}: ${selectedCount} de ${resource.keys.length} selecionadas`}
			>
				<span class="chevron" aria-hidden="true">▸</span>
				<span class="resource-name">{resource.label}</span>
				<span class="resource-count">{selectedCount}/{resource.keys.length}</span>
			</summary>
			<div class="resource-content" role="group" aria-label={resource.label}>
				{#each resource.keys as entry (entry.key)}
					{@const checked = selectedKeys.includes(entry.key)}
					{@const availableCustodies = grantableCustodies(user, entry.key, catalog)}
					{@const canGrant = availableCustodies.length > 0}
					{@const dependents = checked ? dependentsOf(entry.key, selectedKeys, catalogKeys) : []}
					{@const requiredBy = dependents.length > 0}
					{@const blockedDependencies =
						!checked && canGrant ? ungrantableDependencies(user, entry.key, catalog) : []}
					{@const custodySelector = checked && !entry.fixedCustody && availableCustodies.length > 1}
					<div
						class={[
							'permission-row',
							{
								blocked: !canGrant || !canEditComposition || blockedDependencies.length > 0
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
									requiredBy ||
									blockedDependencies.length > 0 ||
									(!checked && selectedKeys.length >= compositionLimit)}
								onchange={(event) => setKeySelected(entry.key, event.currentTarget.checked)}
							/>
							<span>
								<strong>{entry.label}</strong>
								{#if entry.description}
									<span class="permission-description">{entry.description}</span>
								{/if}
								<code>{entry.key}</code>
								{#if requiredBy}
									<small class="requirement-note">
										Exigida por {dependents.map(permissionLabel).join(', ')}.
									</small>
								{/if}
								{#if !canGrant}
									<small class="blocked-note">
										Sua conta não possui a permissão e o escopo necessários para concedê-la.
									</small>
								{/if}
								{#if blockedDependencies.length > 0}
									<small class="blocked-note">
										Depende de {blockedDependencies.map(permissionLabel).join(', ')}, que sua conta
										não pode conceder.
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

										oncompositionchange?.();
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
			</div>
		</details>
	{:else}
		<p class="catalog-empty">O catálogo não contém permissões disponíveis.</p>
	{/each}

	<p class="dependency-guidance" role="status" aria-live="polite">{dependencyFeedback}</p>

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
					<span>Confirmo que ao remover <code>{key}</code>, {SELF_SERVICE_CONSEQUENCES[key]}</span>
				</label>
			{/each}
		</div>
	{/if}
</section>

<style>
	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}
	.section-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}
	.section-heading h4 {
		margin: 0 0 4px;
		color: var(--heading-color);
		font: var(--h4);
	}
	.section-heading p {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
	}
	.composition-limit {
		flex-shrink: 0;
		color: var(--secondary-color);
		font: var(--label);
	}
	.composition-summary {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
	}
	.group-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
	}
	.link-button {
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--secondary-color);
		font: var(--label);
		text-decoration: underline;
		cursor: pointer;
	}
	.link-button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}
	.resource-group {
		min-width: 0;
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}
	.resource-group.has-selection {
		border-color: var(--secondary-color);
	}
	.resource-summary {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		color: var(--heading-color);
		font: var(--label);
		cursor: pointer;
		list-style: none;
	}
	.resource-summary::-webkit-details-marker {
		display: none;
	}
	.resource-summary::marker {
		content: '';
	}
	.resource-summary:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: -2px;
		border-radius: var(--radius-sm);
	}
	.chevron {
		flex-shrink: 0;
		color: var(--secondary-color);
		transition: transform 150ms ease;
	}
	.resource-group[open] .chevron {
		transform: rotate(90deg);
	}
	.resource-name {
		flex: 1;
		min-width: 0;
	}
	.resource-count {
		flex-shrink: 0;
		color: var(--gray);
		font-size: 12px;
	}
	.resource-content {
		padding: 0 var(--spacing-sm) var(--spacing-sm);
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
	.permission-choice {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		min-width: 0;
		cursor: pointer;
	}
	.permission-choice > span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.permission-choice strong {
		color: var(--black);
		font: var(--label);
	}
	.permission-description {
		color: var(--gray);
		font: var(--paragrafo);
		font-size: 12px;
	}
	.permission-choice code,
	.self-service-confirmations code {
		color: var(--secondary-color);
		font-size: 11px;
	}
	.permission-choice small {
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
	.permission-choice .requirement-note {
		color: var(--secondary-color);
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
	.dependency-guidance:empty {
		display: none;
	}
	.custody-field {
		display: flex;
		flex-shrink: 0;
		flex-direction: column;
		gap: 3px;
		color: var(--gray);
		font-size: 11px;
	}
	select {
		width: 100%;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
		color: var(--black);
		font: var(--paragrafo);
	}
	select:focus {
		outline: 2px solid var(--secondary-color);
		outline-offset: 1px;
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
	.dependency-error {
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
	.self-service-confirmations label {
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
	@media (max-width: 620px) {
		.permission-row {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
