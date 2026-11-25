<script lang="ts">
	import type { SessionUser } from '$lib/types/auth';
	import type { PermissionCustody, PermissionKey } from '$lib/types/permission';
	import { custodyLabels } from '$lib/utils/profile-labels';
	import type { ProfileKeyCatalog } from '$lib/types/profile';
	import {
		SELF_SERVICE_CONSEQUENCES,
		grantableCustodies,
		isSelfServiceKey,
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

	let dependencyGuidance = $state('');
	const catalogKeys = $derived(resources.flatMap((resource) => resource.keys));

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
		oncompositionchange?.();
		selectedKeys = checked
			? [...new Set([...selectedKeys, key])]
			: selectedKeys.filter((item) => item !== key);
		removedSelfServiceConfirmed = removedSelfServiceConfirmed.filter((item) => item !== key);
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
	{#if isCompositionLocked}
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
				{@const availableCustodies = grantableCustodies(user, entry.key, catalog)}
				{@const canGrant = availableCustodies.length > 0}
				{@const missingForKey = entry.dependencies.filter(
					(dependency) => !selectedKeys.includes(dependency)
				)}
				{@const custodySelector = checked && !entry.fixedCustody && availableCustodies.length > 1}
				<div
					class={[
						'permission-row',
						{
							blocked: !canGrant || !canEditComposition || (!checked && missingForKey.length > 0)
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
