<script lang="ts">
	import type { UserStatus } from '$lib/types/user';

	interface Props {
		onclose: () => void;
		oncreate: (data: {
			name: string;
			email: string;
			role: string;
			status: UserStatus;
			password: string;
		}) => void | Promise<void>;
	}

	let { onclose, oncreate }: Props = $props();

	let name = $state('');
	let email = $state('');
	let role = $state('');
	let status = $state<UserStatus>('Ativo');

	let loading = $state(false);
	let error = $state('');

	function generateTemporaryPassword(length = 12) {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

		const randomValues = new Uint32Array(length);
		crypto.getRandomValues(randomValues);

		return Array.from(randomValues, (value) => chars[value % chars.length]).join('');
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		error = '';

		if (!name.trim()) {
			error = 'Informe o nome completo.';
			return;
		}

		if (!role) {
			error = 'Selecione o perfil.';
			return;
		}

		if (!email.trim()) {
			error = 'Informe o e-mail.';
			return;
		}

		const temporaryPassword = generateTemporaryPassword();

		loading = true;

		try {
			await oncreate({
				name: name.trim(),
				email: email.trim(),
				role,
				status,
				password: temporaryPassword
			});
		} catch {
			error = 'Não foi possível criar o usuário.';
		} finally {
			loading = false;
		}
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
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
		<form onsubmit={handleSubmit}>
			<header class="modal-header">
				<h2 id="create-user-title">Novo Usuário</h2>

				<p>Cadastre as informações do novo usuário</p>
			</header>

			<div class="divider"></div>

			<!-- NOME -->
			<div class="field">
				<label for="user-name"> Nome Completo </label>

				<input id="user-name" type="text" placeholder="Maria Silva" bind:value={name} />
			</div>

			<!-- PERFIL + STATUS -->
			<div class="fields-grid">
				<div class="field">
					<label for="user-role"> Perfil </label>

					<div class="select-wrapper">
						<select id="user-role" bind:value={role}>
							<option value="" disabled> Selecione o perfil </option>

							<option value="Administrador"> Administrador </option>

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
					<label for="user-status"> Status </label>

					<div class="select-wrapper status-select">
						<span class="status-dot" class:inactive={status === 'Inativo'}></span>

						<select id="user-status" bind:value={status}>
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

			<!-- EMAIL -->
			<div class="field">
				<label for="user-email"> E-mail </label>

				<input id="user-email" type="email" placeholder="usuario@MAAT.com.br" bind:value={email} />
			</div>

			<!-- SENHA AUTOMÁTICA -->
			<div class="password-info">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9"></circle>
					<path d="M12 11v5"></path>
					<path d="M12 8h.01"></path>
				</svg>

				<div>
					<strong>Senha automática</strong>

					<span> Uma senha temporária será gerada automaticamente ao criar o usuário. </span>
				</div>
			</div>

			{#if error}
				<p class="error-message" role="alert">
					{error}
				</p>
			{/if}

			<footer class="modal-actions">
				<button type="button" class="cancel-button" onclick={onclose} disabled={loading}>
					Cancelar
				</button>

				<button type="submit" class="create-button" disabled={loading}>
					{loading ? 'Criando...' : 'Criar Usuário'}
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
		gap: var(--spacing-md);

		padding: var(--spacing-lg);
	}

	.modal-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.modal-header h2 {
		margin: 0;
		font: var(--h2);
		color: var(--primary-color);
	}

	.modal-header p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--gray);
	}

	.divider {
		width: 100%;
		height: 1px;
		background-color: var(--white-gray);
	}

	.fields-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.field label {
		font: var(--label);
		color: var(--black);
	}

	.field input,
	.select-wrapper select {
		width: 100%;
		height: 42px;

		padding: 0 var(--spacing-sm);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		background-color: var(--white);

		color: var(--black);

		font: var(--paragrafo);
		font-size: 13px;

		outline: none;

		transition: var(--transition-default);
	}

	.field input:focus,
	.select-wrapper select:focus {
		border-color: var(--secondary-color);
	}

	.field input::placeholder {
		color: var(--gray);
	}

	.select-wrapper {
		position: relative;

		display: flex;
		align-items: center;
	}

	.select-wrapper select {
		padding-right: 40px;
		appearance: none;
		cursor: pointer;
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

		left: 11px;
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

	/* AVISO DA SENHA */

	.password-info {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);

		padding: var(--spacing-sm) var(--spacing-md);

		border-radius: var(--radius-sm);

		background-color: var(--status-blue-bg);
		color: var(--primary-color);
	}

	.password-info > svg {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.password-info div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.password-info strong {
		font: var(--label);
		font-size: 12px;
	}

	.password-info span {
		font: var(--paragrafo);
		font-size: 12px;
		color: var(--gray);
	}

	.error-message {
		margin: 0;
		font: var(--label);
		font-size: 12px;
		color: var(--status-red);
	}

	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;

		gap: var(--spacing-md);

		padding-top: var(--spacing-sm);
	}

	.cancel-button,
	.create-button {
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

	.create-button {
		border: 1px solid var(--primary-color);
		background-color: var(--primary-color);
		color: var(--white);
	}

	.create-button:hover {
		background-color: var(--secondary-color);
		border-color: var(--secondary-color);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 600px) {
		.fields-grid {
			grid-template-columns: 1fr;
		}

		.modal {
			max-height: calc(100dvh - 32px);
			overflow-y: auto;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.cancel-button,
		.create-button {
			width: 100%;
		}
	}
</style>
