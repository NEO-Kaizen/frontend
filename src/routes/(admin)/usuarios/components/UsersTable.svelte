<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	import type { AdminUser, UserAction } from '$lib/types/user';

	import { getInitials } from '$lib/utils/user';

	interface Props {
		users: AdminUser[];

		onaction: (user: AdminUser, action: UserAction) => void;
	}

	let { users, onaction }: Props = $props();

	let openMenuId = $state<string | null>(null);

	function toggleMenu(userId: string) {
		openMenuId = openMenuId === userId ? null : userId;
	}

	function handleAction(user: AdminUser, action: UserAction) {
		onaction(user, action);

		openMenuId = null;
	}
</script>

<div class="table-wrapper">
	<table>
		<colgroup>
			<col class="col-name" />
			<col class="col-email" />
			<col class="col-role" />
			<col class="col-status" />
			<col class="col-actions" />
		</colgroup>

		<thead>
			<tr>
				<th> Nome </th>

				<th> E-mail </th>

				<th> Perfil </th>

				<th> Estado </th>

				<th class="actions-header">
					<span class="sr-only"> Ações </span>
				</th>
			</tr>
		</thead>

		<tbody>
			{#each users as user (user.id)}
				<tr>
					<td>
						<div class="user-cell">
							<div class="avatar" aria-hidden="true">
								{getInitials(user.name)}
							</div>

							<div class="user-info">
								<strong>
									{user.name}
								</strong>

								<span>
									ID #{user.id}
								</span>
							</div>
						</div>
					</td>

					<td>
						<span class="email">
							{user.email}
						</span>
					</td>

					<td>
						<span class="role-badge">
							{user.role}
						</span>
					</td>

					<td>
						<span
							class:active-status={user.status === 'Ativo'}
							class:inactive-status={user.status === 'Inativo'}
							class="status"
						>
							<span class="status-dot" aria-hidden="true"></span>

							{user.status}
						</span>
					</td>

					<td>
						{#if user.role === 'Administrador'}
							<span class="no-actions" aria-hidden="true"> — </span>
						{:else}
							<div class="actions">
								<div class="menu-wrapper">
									<button
										type="button"
										class="icon-button"
										aria-label={`Mais opções para ${user.name}`}
										aria-expanded={openMenuId === user.id}
										onclick={() => toggleMenu(user.id)}
									>
										<span class="dots-icon" aria-hidden="true"> ••• </span>
									</button>

									{#if openMenuId === user.id}
										<div class="user-action-menu">
											<button
												type="button"
												class="menu-item"
												onclick={() => handleAction(user, 'edit')}
											>
												<span class="menu-icon">
													<Icon iconName="edit" iconSize="sm" />
												</span>
												<span>Alterar dados</span>
											</button>

											<div class="menu-divider"></div>

											<button
												type="button"
												class="menu-item"
												onclick={() => handleAction(user, 'reset')}
											>
												<span class="menu-icon">
													<Icon iconName="lock" iconSize="sm" />
												</span>

												<span> Alterar senha </span>
											</button>

											<div class="menu-divider"></div>

											{#if user.status === 'Ativo'}
												<button
													type="button"
													class="menu-item danger"
													onclick={() => handleAction(user, 'deactivate')}
												>
													<span class="menu-icon">
														<Icon iconName="block" iconSize="sm" />
													</span>

													<span> Desativar usuário </span>
												</button>
											{:else}
												<button
													type="button"
													class="menu-item success"
													onclick={() => handleAction(user, 'activate')}
												>
													<span class="menu-icon">
														<Icon iconName="userApproved" iconSize="sm" />
													</span>

													<span> Ativar usuário </span>
												</button>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/if}
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

		table-layout: fixed;

		border-collapse: collapse;
	}

	.col-name {
		width: 30%;
	}

	.col-email {
		width: 32%;
	}

	.col-role {
		width: 15%;
	}

	.col-status {
		width: 12%;
	}

	.col-actions {
		width: 11%;
	}

	th {
		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--background-color);

		border-bottom: var(--border-default);

		color: var(--gray);

		font: var(--label);

		font-size: 11px;

		text-align: left;

		text-transform: uppercase;
	}

	td {
		padding: var(--spacing-md);

		border-bottom: var(--border-default);

		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	tbody tr:hover {
		background-color: var(--background-color);
	}

	.user-cell {
		display: flex;
		align-items: center;

		gap: var(--spacing-md);

		min-width: 0;
	}

	.avatar {
		width: 38px;
		height: 38px;

		display: flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;

		border-radius: 50%;

		background-color: var(--tint);

		color: var(--primary-color);

		font: var(--label);
	}

	.user-info {
		display: flex;
		flex-direction: column;

		gap: 2px;

		min-width: 0;
	}

	.user-info strong {
		overflow: hidden;

		color: var(--black);

		font: var(--label);

		white-space: nowrap;

		text-overflow: ellipsis;
	}

	.user-info span {
		color: var(--gray);

		font-size: 12px;
	}

	.email {
		display: block;

		overflow: hidden;

		color: var(--black);

		white-space: nowrap;

		text-overflow: ellipsis;
	}

	.role-badge {
		display: inline-flex;

		max-width: 100%;

		overflow: hidden;

		padding: 4px var(--spacing-sm);

		background-color: var(--tint);

		border-radius: 999px;

		color: var(--secondary-color);

		font: var(--label);

		font-size: 12px;

		white-space: nowrap;

		text-overflow: ellipsis;
	}

	.status {
		display: inline-flex;
		align-items: center;

		gap: 6px;

		font: var(--label);

		font-size: 12px;

		white-space: nowrap;
	}

	.status-dot {
		width: 7px;
		height: 7px;

		border-radius: 50%;

		background-color: currentColor;
	}

	.active-status {
		color: var(--status-green);
	}

	.inactive-status {
		color: var(--gray);
	}

	.actions-header {
		text-align: center;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.no-actions {
		display: flex;

		align-items: center;
		justify-content: center;

		color: var(--gray);
	}

	.menu-wrapper {
		position: relative;
	}

	.icon-button {
		width: 34px;
		height: 34px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		border: none;

		border-radius: var(--radius-sm);

		background: transparent;

		color: var(--gray);

		cursor: pointer;

		transition: var(--transition-default);
	}

	.icon-button:hover {
		background-color: var(--background-color);

		color: var(--primary-color);
	}

	.dots-icon {
		font-size: 16px;

		letter-spacing: 1px;

		transform: rotate(90deg);
	}

	.user-action-menu {
		position: absolute;

		top: calc(100% + 4px);

		right: 0;

		z-index: 30;

		width: 210px;

		display: flex;
		flex-direction: column;

		padding: var(--spacing-sm);

		background-color: var(--white);

		border: var(--border-default);

		border-radius: var(--radius-sm);

		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.menu-item {
		width: 100%;

		display: flex;
		align-items: center;

		gap: var(--spacing-sm);

		padding: var(--spacing-sm);

		border: none;

		border-radius: var(--radius-sm);

		background: transparent;

		color: var(--black);

		font: var(--label);

		text-align: left;

		cursor: pointer;
	}

	.menu-item:hover {
		background-color: var(--background-color);
	}

	.menu-icon {
		width: 20px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;
	}

	.menu-item.danger {
		color: var(--status-red);
	}

	.menu-item.success {
		color: var(--status-green);
	}

	.menu-divider {
		height: 1px;

		margin: var(--spacing-sm) 0;

		background-color: var(--white-gray);
	}
</style>
