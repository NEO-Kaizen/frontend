<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { AdminUser, UserAction } from '$lib/types/user';

	interface Props {
		users: AdminUser[];
		onaction: (user: AdminUser, action: UserAction) => void;
		onedit?: (user: AdminUser) => void;
		onviewdetails?: (user: AdminUser) => void;
	}

	let { users, onaction, onedit, onviewdetails }: Props = $props();

	let openMenuId = $state<AdminUser['id'] | null>(null);

	function getInitials(name: string) {
		return name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part.charAt(0).toUpperCase())
			.join('');
	}

	function roleClass(role: string) {
		const value = role.toLowerCase();

		if (value.includes('administr')) return 'admin';
		if (value.includes('analista')) return 'analyst';
		if (value.includes('gestor')) return 'manager';
		if (value.includes('solicitante')) return 'requester';

		return '';
	}
</script>

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				<th scope="col">Nome</th>
				<th scope="col">E-mail</th>
				<th scope="col">Perfil</th>
				<th scope="col">Status</th>
				<th scope="col" class="actions-header">Ações</th>
			</tr>
		</thead>

		<tbody>
			{#each users as user (user.id)}
				<tr>
					<!-- NOME -->
					<td>
						<div class="user-cell">
							<div
								class="avatar"
								class:avatar-admin={roleClass(user.role) === 'admin'}
								class:avatar-analyst={roleClass(user.role) === 'analyst'}
								class:avatar-manager={roleClass(user.role) === 'manager'}
							>
								{getInitials(user.name)}
							</div>

							<div class="user-info">
								<strong>{user.name}</strong>
								<span>ID: {user.id}</span>
							</div>
						</div>
					</td>

					<!-- EMAIL -->
					<td class="email">
						{user.email}
					</td>

					<!-- PERFIL -->
					<td>
						<span class="role-badge {roleClass(user.role)}">
							{user.role}
						</span>
					</td>

					<!-- STATUS -->
					<td>
						<div class="status" class:inactive={user.status === 'Inativo'}>
							<span class="status-dot"></span>
							{user.status}
						</div>
					</td>

					<!-- AÇÕES -->
					<td>
						<div class="actions">
							<!-- LÁPIS = EDITAR USUÁRIO -->
							<button
								type="button"
								class="icon-button"
								title="Editar usuário"
								aria-label={`Editar ${user.name}`}
								onclick={() => onedit?.(user)}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M12 20h9"></path>
									<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
								</svg>
							</button>

							<!-- TRÊS PONTINHOS -->
							<div class="menu-wrapper">
								<button
									type="button"
									class="icon-button"
									title="Mais opções"
									aria-label={`Mais opções para ${user.name}`}
									aria-expanded={openMenuId === user.id}
									onclick={() => {
										openMenuId = openMenuId === user.id ? null : user.id;
									}}
								>
									<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<circle cx="12" cy="5" r="1.7"></circle>
										<circle cx="12" cy="12" r="1.7"></circle>
										<circle cx="12" cy="19" r="1.7"></circle>
									</svg>
								</button>

								{#if openMenuId === user.id}
									<div class="user-action-menu">
										<!-- ALTERAR SENHA -->
										<button
											type="button"
											class="menu-item"
											onclick={() => {
												onaction(user, 'reset');
												openMenuId = null;
											}}
										>
											<span class="menu-icon">
												<Icon iconName="lock" iconSize="sm" />
											</span>

											<span>Alterar senha</span>
										</button>

										<!-- VER DETALHES -->
										<button
											type="button"
											class="menu-item"
											onclick={() => {
												onviewdetails?.(user);
												openMenuId = null;
											}}
										>
											<span class="menu-icon">
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													aria-hidden="true"
												>
													<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path>
													<circle cx="12" cy="12" r="3"></circle>
												</svg>
											</span>

											<span>Ver detalhes</span>
										</button>

										<div class="menu-divider"></div>

										<!-- DESATIVAR / ATIVAR -->
										{#if user.status === 'Ativo'}
											<button
												type="button"
												class="menu-item danger"
												onclick={() => {
													onaction(user, 'deactivate');
													openMenuId = null;
												}}
											>
												<span class="menu-icon">
													<Icon iconName="block" iconSize="sm" />
												</span>

												<span>Desativar usuário</span>
											</button>
										{:else}
											<button
												type="button"
												class="menu-item success"
												onclick={() => {
													onaction(user, 'activate');
													openMenuId = null;
												}}
											>
												<span class="menu-icon">
													<Icon iconName="userApproved" iconSize="sm" />
												</span>

												<span>Ativar usuário</span>
											</button>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		width: 100%;
		max-width: 100%;

		overflow-x: auto;

		background-color: var(--white);
	}

	table {
		width: 100%;
		min-width: 760px;

		border-collapse: collapse;
	}

	/* CABEÇALHO */

	thead {
		background-color: var(--status-blue-bg);
	}

	th {
		padding: var(--spacing-sm) var(--spacing-md);

		text-align: left;
		text-transform: uppercase;

		font: var(--label);
		font-size: 11px;

		color: var(--primary-color);

		white-space: nowrap;
	}

	.actions-header {
		text-align: center;
	}

	/* LINHAS */

	td {
		padding: var(--spacing-sm) var(--spacing-md);

		border-bottom: var(--border-default);

		font: var(--paragrafo);
		font-size: 13px;

		color: var(--black);

		vertical-align: middle;
	}

	tbody tr {
		background-color: var(--white);

		transition: var(--transition-default);
	}

	tbody tr:hover {
		background-color: var(--status-blue-bg);
	}

	/* USUÁRIO */

	.user-cell {
		display: flex;
		align-items: center;

		gap: var(--spacing-sm);

		min-width: 180px;
	}

	.avatar {
		width: 34px;
		height: 34px;

		flex-shrink: 0;

		display: flex;
		align-items: center;
		justify-content: center;

		border-radius: 50%;

		background-color: var(--white-gray);
		color: var(--black);

		font: var(--label);
		font-size: 11px;
	}

	.avatar-admin {
		background-color: var(--status-blue-bg);
		color: var(--primary-color);
	}

	.avatar-analyst {
		background-color: var(--status-blue-bg);
		color: var(--secondary-color);
	}

	.avatar-manager {
		background-color: var(--status-yellow-bg);
		color: var(--status-yellow);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.user-info strong {
		font: var(--label);
		font-size: 12px;
		font-weight: 500;

		color: var(--rich-black);

		white-space: nowrap;
	}

	.user-info span {
		font: var(--paragrafo);
		font-size: 9px;

		color: var(--gray);
	}

	.email {
		white-space: nowrap;
	}

	/* PERFIL */

	.role-badge {
		display: inline-flex;
		align-items: center;

		padding: 2px var(--spacing-sm);

		border: var(--border-default);
		border-radius: 999px;

		background-color: var(--white);

		color: var(--black);

		font: var(--label);
		font-size: 9px;
		font-weight: 500;

		white-space: nowrap;
	}

	.role-badge.admin {
		background-color: var(--status-blue-bg);
		color: var(--primary-color);
	}

	.role-badge.analyst {
		background-color: var(--status-blue-bg);
		color: var(--secondary-color);
	}

	.role-badge.manager {
		background-color: var(--status-yellow-bg);
		color: var(--status-yellow);
	}

	.role-badge.requester {
		background-color: var(--white);
		color: var(--black);
	}

	/* STATUS */

	.status {
		display: inline-flex;
		align-items: center;

		gap: 6px;

		color: var(--status-green);

		font: var(--label);
		font-size: 11px;

		white-space: nowrap;
	}

	.status-dot {
		width: 6px;
		height: 6px;

		border-radius: 50%;

		background-color: var(--status-green);
	}

	.status.inactive {
		color: var(--gray);
	}

	.status.inactive .status-dot {
		background-color: var(--white-gray);
	}

	/* AÇÕES */

	.actions {
		display: flex;
		align-items: center;
		justify-content: center;

		gap: 2px;
	}

	.icon-button {
		width: 28px;
		height: 28px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding: 0;

		border: none;
		border-radius: var(--radius-sm);

		background: transparent;

		color: var(--black);

		cursor: pointer;

		transition: var(--transition-default);
	}

	.icon-button:hover {
		background-color: var(--status-blue-bg);
		color: var(--secondary-color);
	}

	.icon-button:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.icon-button svg {
		width: 15px;
		height: 15px;
	}

	.menu-wrapper {
		position: relative;
	}

	.action-menu {
		position: absolute;
		z-index: 30;

		top: calc(100% + 4px);
		right: 0;

		width: 185px;

		padding: var(--spacing-sm);

		background-color: var(--white);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		box-shadow: var(--regular-shadow);
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
	}

	.menu-wrapper {
		position: relative;
	}

	.icon-button {
		width: 30px;
		height: 30px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding: 0;

		border: none;
		border-radius: var(--radius-sm);

		background: transparent;
		color: var(--black);

		cursor: pointer;
		transition: var(--transition-default);
	}

	.icon-button svg {
		width: 16px;
		height: 16px;
	}

	.icon-button:hover {
		background-color: var(--status-blue-bg);
		color: var(--secondary-color);
	}

	.user-action-menu {
		position: absolute;
		z-index: 100;

		top: calc(100% + var(--spacing-sm));
		right: 0;

		width: 205px;

		display: flex;
		flex-direction: column;

		padding: var(--spacing-sm);

		background-color: var(--white);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		box-shadow: var(--regular-shadow);
	}

	.menu-item {
		width: 100%;
		min-height: 38px;

		display: flex;
		align-items: center;

		gap: var(--spacing-sm);

		padding: var(--spacing-sm);

		border: none;
		border-radius: var(--radius-sm);

		background: transparent;
		color: var(--black);

		font: var(--label);
		font-size: 13px;

		text-align: left;
		cursor: pointer;

		transition: var(--transition-default);
	}

	.menu-item:hover {
		background-color: var(--status-blue-bg);
		color: var(--primary-color);
	}

	.menu-icon {
		width: 20px;
		height: 20px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;
	}

	.menu-icon svg {
		width: 17px;
		height: 17px;
	}

	.menu-divider {
		width: 100%;
		height: 1px;

		margin: 4px 0;

		background-color: var(--white-gray);
	}

	.menu-item.danger {
		color: var(--status-red);
	}

	.menu-item.danger:hover {
		background-color: var(--status-red-bg);
	}

	.menu-item.success {
		color: var(--status-green);
	}

	.menu-item.success:hover {
		background-color: var(--status-green-bg);
	}
</style>
