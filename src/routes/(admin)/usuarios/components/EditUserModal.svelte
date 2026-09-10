<script lang="ts">
	import type { AdminUser, UserStatus } from '$lib/types/user';

	interface Props {
		user: AdminUser;
		loading?: boolean;
		error?: string;
		onclose: () => void;
		onsave: (data: { user: AdminUser; role: string; status: UserStatus }) => void;
	}

	let { user, loading = false, error = '', onclose, onsave }: Props = $props();

	let role = $state(user.role);
	let status = $state<UserStatus>(user.status);

	const permissions: Record<string, string[]> = {
		Admin: [
			'Consultar demandas atribuídas',
			'Observações e pendências',
			'Registrar análises',
			'Alterar status de demandas',
			'Registrar mapeamento'
		],

		Analista: [
			'Consultar demandas atribuídas',
			'Observações e pendências',
			'Registrar análises',
			'Alterar status de demandas',
			'Registrar mapeamento'
		],

		Gestor: [
			'Consultar demandas atribuídas',
			'Observações e pendências',
			'Alterar status de demandas',
			'Registrar mapeamento'
		],

		Solicitante: ['Consultar demandas atribuídas', 'Observações e pendências']
	};

	let currentPermissions = $derived(permissions[role] ?? permissions.Solicitante);

	function getInitials(name: string) {
		return name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part.charAt(0).toUpperCase())
			.join('');
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		onsave({
			user,
			role,
			status
		});
	}
</script>

<div
	class="modal-backdrop"
	role="presentation"
	onclick={(event) => {
		if (event.target === event.currentTarget) {
			onclose();
		}
	}}
>
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
		<form onsubmit={handleSubmit}>
			<!-- TÍTULO -->
			<header class="modal-header">
				<h2 id="edit-user-title">Editar Usuário</h2>

				<p>Atualize informações e permissões do usuário</p>
			</header>

			<!-- USUÁRIO -->
			<div class="user-summary">
				<div class="avatar">
					{getInitials(user.name)}
				</div>

				<div class="user-data">
					<strong>{user.name}</strong>
					<span>{user.email}</span>
				</div>
			</div>

			<div class="divider"></div>

			<!-- PERFIL E STATUS -->
			<div class="fields-grid">
				<div class="field">
					<label for="edit-role"> Perfil </label>

					<div class="select-wrapper">
						<select id="edit-role" bind:value={role}>
							<option value="Admin"> Admin </option>

							<option value="Analista"> Analista </option>

							<option value="Gestor"> Gestor </option>

							<option value="Solicitante"> Solicitante </option>
						</select>

						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="m6 9 6 6 6-6"></path>
						</svg>
					</div>
				</div>

				<div class="field">
					<label for="edit-status"> Status </label>

					<div class="select-wrapper status-select">
						<span class="status-dot" class:inactive={status === 'Inativo'}></span>

						<select id="edit-status" bind:value={status}>
							<option value="Ativo"> Ativo </option>

							<option value="Inativo"> Inativo </option>
						</select>

						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="m6 9 6 6 6-6"></path>
						</svg>
					</div>
				</div>
			</div>

			<!-- PERMISSÕES -->
			<section class="permissions-box">
				<h3>Permissões do Perfil</h3>

				<p>Este perfil possui as seguintes permissões:</p>

				<div class="permissions-list">
					{#each currentPermissions as permission}
						<div class="permission">
							<span class="check">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="m5 12 4 4L19 6"></path>
								</svg>
							</span>

							<span>{permission}</span>
						</div>
					{/each}
				</div>
			</section>

			{#if error}
				<p class="error-message" role="alert">
					{error}
				</p>
			{/if}

			<!-- BOTÕES -->
			<footer class="modal-actions">
				<button type="button" class="cancel-button" onclick={onclose} disabled={loading}>
					Cancelar
				</button>

				<button type="submit" class="save-button" disabled={loading}>
					{loading ? 'Salvando...' : 'Salvar Alterações'}
				</button>
			</footer>
		</form>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;

		display: flex;
		align-items: center;
		justify-content: center;

		padding: var(--spacing-md);

		background-color: rgba(15, 26, 42, 0.35);
	}

	.modal {
		width: 100%;
		max-width: 600px;

		background-color: var(--white);

		border: var(--border-default);
		border-radius: var(--radius-md);

		box-shadow: var(--regular-shadow);
	}

	form {
		display: flex;
		flex-direction: column;

		padding: var(--spacing-lg);
	}

	/* CABEÇALHO */

	.modal-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.modal-header h2 {
		margin: 0;

		font: var(--h2);
		font-size: 26px;

		color: var(--primary-color);
	}

	.modal-header p {
		margin: 0;

		font: var(--paragrafo);
		font-size: 14px;

		color: var(--black);
	}

	/* USUÁRIO */

	.user-summary {
		display: flex;
		align-items: center;

		gap: var(--spacing-md);

		padding: var(--spacing-md) 0;
	}

	.avatar {
		width: 62px;
		height: 62px;

		display: flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;

		border-radius: 50%;

		background-color: var(--status-blue-bg);
		color: var(--secondary-color);

		font: var(--label);
		font-size: 14px;
		font-weight: 700;
	}

	.user-data {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.user-data strong {
		font: var(--label);
		color: var(--rich-black);
	}

	.user-data span {
		font: var(--paragrafo);
		font-size: 13px;
		color: var(--black);
	}

	.divider {
		width: 100%;
		height: 1px;

		margin-bottom: var(--spacing-md);

		background-color: var(--white-gray);
	}

	/* CAMPOS */

	.fields-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;

		gap: var(--spacing-lg);

		margin-bottom: var(--spacing-md);
	}

	.field {
		display: flex;
		flex-direction: column;

		gap: var(--spacing-sm);
	}

	.field label {
		color: var(--black);
	}

	.select-wrapper {
		position: relative;

		display: flex;
		align-items: center;
	}

	.select-wrapper select {
		width: 100%;
		height: 42px;

		padding: 0 40px 0 var(--spacing-sm);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		background-color: var(--white);

		color: var(--rich-black);

		font: var(--paragrafo);
		font-size: 13px;

		outline: none;

		appearance: none;
		cursor: pointer;
	}

	.select-wrapper select:focus {
		border-color: var(--secondary-color);
	}

	.select-wrapper > svg {
		position: absolute;

		right: var(--spacing-sm);

		width: 16px;
		height: 16px;

		color: var(--gray);

		pointer-events: none;
	}

	.status-select select {
		padding-left: 30px;
		color: var(--status-green);
	}

	.status-dot {
		position: absolute;

		left: 10px;
		z-index: 1;

		width: 7px;
		height: 7px;

		border-radius: 50%;

		background-color: var(--status-green);

		pointer-events: none;
	}

	.status-dot.inactive {
		background-color: var(--gray);
	}

	/* PERMISSÕES */

	.permissions-box {
		padding: var(--spacing-sm);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		background-color: var(--white);
	}

	.permissions-box h3 {
		margin: 0 0 var(--spacing-sm);

		font: var(--h4);
		font-size: 15px;

		color: var(--black);
	}

	.permissions-box > p {
		margin: 0 0 var(--spacing-sm);

		font: var(--label);
		font-size: 12px;

		color: var(--black);
	}

	.permissions-list {
		display: flex;
		flex-direction: column;

		gap: var(--spacing-sm);
	}

	.permission {
		display: flex;
		align-items: center;

		gap: var(--spacing-sm);

		font: var(--paragrafo);
		font-size: 12px;

		color: var(--black);
	}

	.check {
		width: 18px;
		height: 18px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;

		border-radius: 50%;

		background-color: var(--secondary-color);
		color: var(--white);
	}

	.check svg {
		width: 11px;
		height: 11px;
	}

	/* ERRO */

	.error-message {
		margin: var(--spacing-sm) 0 0;

		font: var(--label);
		font-size: 12px;

		color: var(--status-red);
	}

	/* BOTÕES */

	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;

		gap: var(--spacing-md);

		margin-top: var(--spacing-md);
	}

	.cancel-button,
	.save-button {
		min-height: 40px;

		padding: 0 var(--spacing-md);

		border-radius: var(--radius-sm);

		cursor: pointer;

		transition: var(--transition-default);
	}

	.cancel-button {
		border: 1px solid var(--primary-color);

		background-color: transparent;
		color: var(--primary-color);
	}

	.cancel-button:hover {
		background-color: var(--status-blue-bg);
	}

	.save-button {
		border: 1px solid var(--primary-color);

		background-color: var(--primary-color);
		color: var(--white);
	}

	.save-button:hover {
		background-color: var(--secondary-color);
		border-color: var(--secondary-color);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 600px) {
		.modal {
			max-height: calc(100dvh - 32px);
			overflow-y: auto;
		}

		form {
			padding: var(--spacing-md);
		}

		.fields-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-md);
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.cancel-button,
		.save-button {
			width: 100%;
		}
	}
</style>
