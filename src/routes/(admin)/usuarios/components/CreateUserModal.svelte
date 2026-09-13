<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';

	import type { CreateUserData, CreateUserResponse, UserStatus, UserType } from '$lib/types/user';

	import { isRequired, isValidEmail, isValidText } from '$lib/utils/validations';

	interface Props {
		loading?: boolean;
		error?: string;
		onclose: () => void;
		oncreate: (data: CreateUserData) => Promise<CreateUserResponse>;
	}

	let { loading = false, error = '', onclose, oncreate }: Props = $props();

	let name = $state('');
	let email = $state('');

	const role: UserType = 'Solicitante';
	const status: UserStatus = 'Ativo';

	let nameError = $state('');
	let emailError = $state('');

	let temporaryPassword = $state('');
	let createdUserName = $state('');

	function validate(): boolean {
		nameError = '';
		emailError = '';

		if (!isRequired(name)) {
			nameError = 'Informe o nome completo.';
		} else if (!isValidText(name)) {
			nameError = 'O nome deve conter apenas letras e espaços.';
		}

		if (!isRequired(email)) {
			emailError = 'Informe o e-mail.';
		} else if (!isValidEmail(email)) {
			emailError = 'Informe um e-mail válido.';
		}

		return !nameError && !emailError;
	}

	async function handleCreate() {
		if (loading) {
			return;
		}

		if (!validate()) {
			return;
		}

		try {
			const result = await oncreate({
				name: name.trim(),
				email: email.trim(),
				role,
				status
			});

			createdUserName = result.user.name;
			temporaryPassword = result.temporaryPassword;
		} catch {
			return;
		}
	}

	function handleClose() {
		name = '';
		email = '';

		nameError = '';
		emailError = '';

		temporaryPassword = '';
		createdUserName = '';

		onclose();
	}
</script>

<div class="modal-backdrop" role="presentation">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
		{#if temporaryPassword}
			<div class="modal-header">
				<div>
					<h2 id="create-user-title">Usuário cadastrado</h2>

					<p>O solicitante foi cadastrado com sucesso.</p>
				</div>

				<button type="button" class="close-button" aria-label="Fechar" onclick={handleClose}>
					×
				</button>
			</div>

			<div class="modal-content">
				<div class="success-box">
					<strong>
						{createdUserName}
					</strong>

					<p>Guarde a senha temporária abaixo. Ela será exibida somente nesta etapa.</p>
				</div>

				<div class="password-box">
					<span class="field-label"> Senha temporária </span>

					<strong class="temporary-password">
						{temporaryPassword}
					</strong>
				</div>
			</div>

			<div class="modal-footer">
				<Button variant="primary" onclick={handleClose}>Concluir</Button>
			</div>
		{:else}
			<div class="modal-header">
				<div>
					<h2 id="create-user-title">Adicionar usuário</h2>

					<p>Cadastre um novo solicitante no MAAT Flow.</p>
				</div>

				<button type="button" class="close-button" aria-label="Fechar" onclick={handleClose}>
					×
				</button>
			</div>

			<div class="modal-content">
				<div class="field">
					<span class="field-label"> Nome completo </span>

					<Input
						type="text"
						placeholder="Digite o nome completo"
						aria-label="Nome completo"
						bind:value={name}
					/>

					{#if nameError}
						<p class="field-error">
							{nameError}
						</p>
					{/if}
				</div>

				<div class="field">
					<span class="field-label"> E-mail </span>

					<Input
						type="email"
						placeholder="Digite o e-mail"
						aria-label="E-mail"
						bind:value={email}
					/>

					{#if emailError}
						<p class="field-error">
							{emailError}
						</p>
					{/if}
				</div>

				<div class="form-row">
					<div class="field">
						<span class="field-label"> Perfil </span>

						<div class="readonly-field">Solicitante</div>
					</div>

					<div class="field">
						<span class="field-label"> Status </span>

						<div class="readonly-field">Ativo</div>
					</div>
				</div>

				{#if error}
					<p class="form-error" role="alert">
						{error}
					</p>
				{/if}
			</div>

			<div class="modal-footer">
				<Button variant="outline" onclick={handleClose}>Cancelar</Button>

				<Button variant="primary" onclick={handleCreate}>
					{loading ? 'Cadastrando...' : 'Cadastrar usuário'}
				</Button>
			</div>
		{/if}
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

		background-color: rgba(15, 26, 42, 0.55);
	}

	.modal {
		width: 100%;
		max-width: 560px;

		display: flex;
		flex-direction: column;

		background-color: var(--white);

		border: var(--border-default);
		border-radius: var(--radius-md);

		box-shadow: var(--regular-shadow);

		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;

		gap: var(--spacing-md);

		padding: var(--spacing-lg);

		border-bottom: var(--border-default);
	}

	.modal-header h2 {
		margin: 0;

		font: var(--h3);

		color: var(--primary-color);
	}

	.modal-header p {
		margin-top: var(--spacing-sm);

		color: var(--gray);

		font: var(--paragrafo);
	}

	.close-button {
		width: 34px;
		height: 34px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		flex-shrink: 0;

		border: none;
		border-radius: var(--radius-sm);

		background: transparent;

		color: var(--gray);

		font-size: 26px;
		line-height: 1;

		cursor: pointer;
	}

	.close-button:hover {
		background-color: var(--background-color);

		color: var(--black);
	}

	.modal-content {
		display: flex;
		flex-direction: column;

		gap: var(--spacing-md);

		padding: var(--spacing-lg);
	}

	.field {
		width: 100%;

		display: flex;
		flex-direction: column;

		gap: var(--spacing-sm);
	}

	.field-label {
		font: var(--label);

		color: var(--black);
	}

	.form-row {
		display: grid;

		grid-template-columns: repeat(2, minmax(0, 1fr));

		gap: var(--spacing-md);
	}

	.readonly-field {
		min-height: 42px;

		display: flex;
		align-items: center;

		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--background-color);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		color: var(--gray);

		font: var(--paragrafo);
	}

	.field-error,
	.form-error {
		margin: 0;

		color: var(--status-red);

		font: var(--label);

		font-size: 12px;
	}

	.form-error {
		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--status-red-bg);

		border-radius: var(--radius-sm);
	}

	.success-box {
		display: flex;
		flex-direction: column;

		gap: var(--spacing-sm);

		padding: var(--spacing-md);

		background-color: var(--status-green-bg);

		border-radius: var(--radius-sm);
	}

	.success-box strong {
		color: var(--status-green);

		font: var(--h4);
	}

	.success-box p {
		margin: 0;

		color: var(--black);

		font: var(--paragrafo);
	}

	.password-box {
		display: flex;
		flex-direction: column;

		gap: var(--spacing-sm);
	}

	.temporary-password {
		padding: var(--spacing-md);

		background-color: var(--background-color);

		border: var(--border-default);
		border-radius: var(--radius-sm);

		color: var(--primary-color);

		font-family: monospace;
		font-size: 18px;

		letter-spacing: 1px;

		word-break: break-all;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;

		gap: var(--spacing-sm);

		padding: var(--spacing-md) var(--spacing-lg);

		border-top: var(--border-default);
	}

	@media (max-width: 600px) {
		.modal-backdrop {
			align-items: flex-end;

			padding: 0;
		}

		.modal {
			max-width: none;

			border-radius: var(--radius-md) var(--radius-md) 0 0;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.modal-footer {
			flex-direction: column-reverse;
			align-items: stretch;
		}
	}
</style>
