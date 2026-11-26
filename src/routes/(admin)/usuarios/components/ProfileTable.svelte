<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import type { SessionUser } from '$lib/types/auth';
	import type { Permission } from '$lib/types/permission';
	import type { Profile } from '$lib/types/profile';
	import { permissionLabel, resourceLabel } from '$lib/services/profiles/permission-ui';
	import { custodyLabels } from '$lib/utils/profile-labels';
	import { canEditProfile, canGrantCustody } from '$lib/utils/permission-checks';
	import { profileStatusRestriction } from '$lib/services/profiles/profile-status.service';

	interface Props {
		profiles: Profile[];
		canManage: boolean;
		user: SessionUser;
		onedit: (profile: Profile) => void;
		onduplicate: (profile: Profile) => void;
		onstatus: (profile: Profile) => void;
	}

	interface PermissionGroup {
		id: string;
		label: string;
		items: Permission[];
	}

	let { profiles, canManage, user, onedit, onduplicate, onstatus }: Props = $props();
	let expandedProfileId = $state<string | null>(null);
	let showAllPermissions = $state(false);

	function groupPermissions(permissions: Permission[]): PermissionGroup[] {
		const groups: Record<string, PermissionGroup> = {};
		for (const permission of permissions) {
			const id = permission.key.split(':')[0] || 'permissions';
			let group = groups[id];
			if (!group) {
				group = { id, label: resourceLabel(id), items: [] };
				groups[id] = group;
			}
			group.items.push(permission);
		}

		return Object.values(groups);
	}

	const expandedGroups = $derived.by(() => {
		const profile = profiles.find((item) => item.id === expandedProfileId);
		return profile ? groupPermissions(profile.permissions) : [];
	});

	const expandedNeedsClamp = $derived(
		expandedProfileId !== null &&
			expandedGroups.reduce((total, group) => total + group.items.length, 0) +
				expandedGroups.length >
				6
	);

	function toggleProfilePermissions(profileId: string) {
		expandedProfileId = expandedProfileId === profileId ? null : profileId;
		showAllPermissions = false;
	}

	const duplicateRestrictionMessage =
		'Não é possível duplicar: sua conta não pode conceder todas as permissões e escopos herdados deste perfil.';

	function canDuplicateProfile(profile: Profile): boolean {
		return (
			canEditProfile(user, profile) &&
			profile.permissions.every((requestedPermission) =>
				user.permissions.some(
					(actorPermission) =>
						actorPermission.key === requestedPermission.key &&
						canGrantCustody(actorPermission.custody, requestedPermission.custody)
				)
			)
		);
	}
</script>

{#if profiles.length === 0}
	<p class="empty-state" role="status">Nenhum perfil encontrado.</p>
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
					{@const canDuplicate = canDuplicateProfile(profile)}
					{@const canEdit = canEditProfile(user, profile)}
					{@const displayName = profile.name || 'perfil sem nome'}
					{@const editRestrictionMessage = `Sua sessão atual informa a função “${user.role}”. Seu perfil não tem autoridade suficiente para editar este perfil. O servidor continua sendo a autoridade final de autorização.`}
					{@const permissionCount = profile.permissions.length}
					{@const isExpanded = expandedProfileId === profile.id}
					{@const permissionsLabel = `${permissionCount} ${permissionCount === 1 ? 'permissão' : 'permissões'}`}
					{@const duplicateRestriction = !canEdit
						? 'Seu perfil não tem autoridade suficiente para duplicar este perfil.'
						: duplicateRestrictionMessage}
					{@const statusRestriction = profileStatusRestriction(profile, { canEdit })}
					{@const statusRestrictionMessage = statusRestriction.tableMessage}
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
						<td class="composition-cell">
							{#if permissionCount > 0}
								<button
									type="button"
									id={`profile-permissions-toggle-${profile.id}`}
									class="composition-toggle"
									aria-expanded={isExpanded}
									aria-controls={isExpanded ? `profile-permissions-${profile.id}` : undefined}
									aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} ${permissionsLabel} do perfil ${displayName}`}
									onclick={() => toggleProfilePermissions(profile.id)}
								>
									{permissionsLabel}
									<span
										class={['composition-chevron', { expanded: isExpanded }]}
										aria-hidden="true"
									>
										<Icon iconName="expandMore" iconSize="sm" />
									</span>
								</button>
								{#if isExpanded}
									<div
										id={`profile-permissions-${profile.id}`}
										class={[
											'permission-list',
											{ clamped: expandedNeedsClamp && !showAllPermissions }
										]}
										role="region"
										aria-label={`Permissões do perfil ${displayName}`}
									>
										{#each expandedGroups as group (group.id)}
											<section class="permission-group" aria-label={group.label}>
												<h3 class="permission-group-title">
													<span>{group.label}</span>
													<span class="permission-group-count">
														{group.items.length}
														{group.items.length === 1 ? 'permissão' : 'permissões'}
													</span>
												</h3>
												<ul role="list">
													{#each group.items as permission (permission.key)}
														<li>
															<span class="permission-name">{permissionLabel(permission.key)}</span>
															<span class="permission-scope"
																>Escopo: {custodyLabels[permission.custody]}</span
															>
														</li>
													{/each}
												</ul>
											</section>
										{/each}
									</div>
									{#if expandedNeedsClamp}
										<button
											type="button"
											class="permission-more"
											aria-expanded={showAllPermissions}
											aria-controls={`profile-permissions-${profile.id}`}
											onclick={() => (showAllPermissions = !showAllPermissions)}
										>
											{showAllPermissions ? 'Ver menos' : 'Ver mais'}
										</button>
									{/if}
								{/if}
							{:else}
								<span class="composition-empty">Nenhuma permissão</span>
							{/if}
						</td>
						<td>
							<div class="flags">
								<span class={{ enabled: profile.isAssignableTriage }}>
									Triagem<span class="sr-only">
										{profile.isAssignableTriage ? ': habilitado' : ': desabilitado'}</span
									>
								</span>
								<span class={{ enabled: profile.isAssignableMapping }}>
									Mapeamento<span class="sr-only">
										{profile.isAssignableMapping ? ': habilitado' : ': desabilitado'}</span
									>
								</span>
							</div>
						</td>
						<td>
							<span class={['status', { active: profile.isActive }]}>
								<span aria-hidden="true"></span>
								{profile.isActive ? 'Ativo' : 'Inativo'}
							</span>
						</td>
						<td>{profile.userCount}</td>
						{#if canManage}
							<td>
								<div class="row-actions">
									<Button
										variant="outline"
										disabled={!canEdit}
										aria-label={`Editar perfil ${displayName}`}
										onclick={() => onedit(profile)}
									>
										Editar
									</Button>
									{#if !canEdit}
										<InfoTip
											side="top"
											align="end"
											label={`Motivo da restrição para editar o perfil ${displayName}`}
											text={editRestrictionMessage}
										/>
									{/if}
									<Button
										variant="outline"
										disabled={!canDuplicate}
										aria-label={`Duplicar perfil ${displayName}`}
										onclick={() => onduplicate(profile)}
									>
										Duplicar
									</Button>
									{#if !canDuplicate}
										<InfoTip
											side="top"
											align="end"
											label={`Motivo da restrição para duplicar o perfil ${displayName}`}
											text={duplicateRestriction}
										/>
									{/if}
									<Button
										variant="outline-neutral"
										disabled={statusRestriction.blocked}
										aria-label={`${profile.isActive ? 'Desativar' : 'Ativar'} perfil ${displayName}`}
										onclick={() => onstatus(profile)}
									>
										{profile.isActive ? 'Desativar' : 'Ativar'}
									</Button>
									{#if statusRestriction.blocked}
										<InfoTip
											side="top"
											align="end"
											label={`Motivo da restrição para ${profile.isActive ? 'desativar' : 'ativar'} o perfil ${displayName}`}
											text={statusRestrictionMessage}
										/>
									{/if}
								</div>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
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
		color: var(--gray);
	}
	.composition-cell {
		width: 320px;
		max-width: 320px;
	}
	.composition-toggle {
		display: inline-flex;
		align-items: center;
		white-space: nowrap;

		gap: var(--spacing-xs);

		padding: var(--spacing-xs) var(--spacing-sm);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		background-color: var(--white);
		color: var(--secondary-color);

		font: var(--label);

		cursor: pointer;
		transition: var(--transition-default);
	}
	.composition-toggle:hover {
		border-color: var(--secondary-color);
		background-color: var(--tint);
		color: var(--primary-color);
	}
	.composition-toggle:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}
	.composition-chevron {
		display: inline-flex;
		transition: transform 150ms ease;
	}
	.composition-chevron.expanded {
		transform: rotate(180deg);
	}
	.composition-empty {
		color: var(--gray);
		font-size: 12px;
	}
	.permission-list {
		position: relative;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		margin-top: var(--spacing-xs);
	}
	.permission-list.clamped {
		max-height: 120px;
		overflow: hidden;
	}
	.permission-list.clamped::after {
		content: '';
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		height: 24px;
		background: linear-gradient(to bottom, transparent, var(--background-color));
		pointer-events: none;
	}
	.permission-group + .permission-group {
		margin-top: var(--spacing-sm);
		padding-top: var(--spacing-sm);
		border-top: 1px solid color-mix(in srgb, var(--border-color) 75%, transparent);
	}
	.permission-group-title {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 4px var(--spacing-sm);
		margin: 0 0 4px;
		padding-bottom: 4px;
		border-bottom: 1px solid color-mix(in srgb, var(--border-color) 75%, transparent);
		color: var(--heading-color);
		font: var(--h4);
		font-size: 12px;
		line-height: 1.4;
	}
	.permission-group-title > span:first-child {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.permission-group-count {
		flex-shrink: 0;
		color: var(--gray);
		font: var(--label);
		font-size: 10px;
	}
	.permission-group ul {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.permission-group li {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 4px var(--spacing-sm);
		min-width: 0;
		padding: 5px 0;
	}
	.permission-group li + li {
		border-top: 1px solid color-mix(in srgb, var(--border-color) 65%, transparent);
	}
	.permission-name {
		min-width: 0;
		color: var(--black);
		font-size: 11px;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}
	.permission-scope {
		flex-shrink: 0;
		padding: 1px 6px;
		border-radius: 999px;
		background-color: var(--tint);
		color: var(--secondary-color);
		font-size: 10px;
		line-height: 1.5;
	}
	.permission-more {
		margin-top: 6px;
		padding: 3px 8px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--secondary-color);
		font: var(--label);
		font-size: 11px;
		line-height: 1.4;
		cursor: pointer;
	}
	.permission-more:hover {
		border-color: var(--secondary-color);
		background-color: var(--tint);
		color: var(--primary-color);
	}
	.permission-more:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
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
	.row-actions {
		flex-wrap: wrap;
	}
	.row-actions > :global(button) {
		padding: 6px 8px;
		font-size: 12px;
	}
	.empty-state {
		margin: 0;
		padding: var(--spacing-xl);
		color: var(--gray);
		text-align: center;
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
	@media (prefers-reduced-motion: reduce) {
		.composition-toggle,
		.composition-chevron {
			transition: none;
		}
	}
</style>
