<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { SessionUser } from '$lib/types/auth';
	import type { Profile } from '$lib/types/profile';
	import { canEditProfile, canGrantCustody } from '$lib/utils/permission-checks';
	import { custodyLabels } from '$lib/utils/profile-labels';
	import { profileStatusRestriction } from '$lib/utils/profile-status';

	interface Props {
		profiles: Profile[];
		canManage: boolean;
		user: SessionUser;
		onedit: (profile: Profile) => void;
		onduplicate: (profile: Profile) => void;
		onstatus: (profile: Profile) => void;
	}

	let { profiles, canManage, user, onedit, onduplicate, onstatus }: Props = $props();

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
					{@const canDuplicate = canDuplicateProfile(profile)}
					{@const canEdit = canEditProfile(user, profile)}
					{@const displayName = profile.name || 'perfil sem nome'}
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
						<td>
							<span class="composition-count">{profile.permissions.length} chaves</span>
							{#if profile.permissions.length > 0}
								<span class="composition-list">
									{profile.permissions
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
							{#if !canEdit}
								<small class="status-note" id={`status-guidance-${profile.id}`}>
									Seu perfil não tem autoridade suficiente para alterar este perfil.
								</small>
							{:else if profile.isActive && profile.isRoot}
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
										disabled={!canEdit}
										aria-label={`Editar perfil ${displayName}`}
										onclick={() => onedit(profile)}
									>
										Editar
									</Button>
									{#if !canEdit}
										<small class="action-note">
											Sua sessão atual informa a função “{user.role}”. Seu perfil não tem autoridade
											suficiente para editar este perfil. O servidor continua sendo a autoridade
											final de autorização.
										</small>
									{/if}
									<Button
										variant="outline"
										disabled={!canDuplicate}
										title={!canDuplicate ? duplicateRestriction : undefined}
										aria-label={`Duplicar perfil ${displayName}`}
										aria-describedby={!canDuplicate
											? `duplicate-guidance-${profile.id}`
											: undefined}
										onclick={() => onduplicate(profile)}
									>
										Duplicar
									</Button>
									<Button
										variant="outline-neutral"
										disabled={!canEdit ||
											(profile.isActive && (profile.isRoot || profile.userCount > 0))}
										title={statusRestrictionMessage || undefined}
										aria-label={`${profile.isActive ? 'Desativar' : 'Ativar'} perfil ${displayName}`}
										aria-describedby={statusRestrictionMessage
											? `status-guidance-${profile.id}`
											: undefined}
										onclick={() => onstatus(profile)}
									>
										{profile.isActive ? 'Desativar' : 'Ativar'}
									</Button>
								</div>
								{#if !canDuplicate}
									<small id={`duplicate-guidance-${profile.id}`} class="action-note">
										{duplicateRestriction}
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
</style>
