<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { CreateUserFormData, CreateUserResponse } from '$lib/types/user';
	import { isRequired, isValidEmail, isValidText } from '$lib/utils/validations';

	interface Props {
		loading?: boolean;
		error?: string;
		onclose: () => void;
		oncreate: (data: CreateUserFormData) => Promise<CreateUserResponse>;
	}

	let { loading = false, error = '', onclose, oncreate }: Props = $props();

	let name = $state('');
	let email = $state('');

	let nameError = $state('');
	let emailError = $state('');

	let temporaryPassword = $state('');
	let createdUserName = $state('');

	function validate(): boolean {
		nameError = '';
		emailError = '';

		const trimmedName = name.trim();
		const trimmedEmail = email.trim();

		if (!isRequired(trimmedName)) {
			nameError = 'Informe o nome completo.';
		} else if (!isValidText(trimmedName)) {
			nameError = 'O nome deve conter apenas letras e espaços.';
		} else if (trimmedName.length > 150) {
			nameError = 'O nome deve ter no máximo 150 caracteres.';
		}

		if (!isRequired(trimmedEmail)) {
			emailError = 'Informe o e-mail.';
		} else if (!isValidEmail(trimmedEmail)) {
			emailError = 'Informe um e-mail válido.';
		} else if (trimmedEmail.length > 254) {
			emailError = 'O e-mail deve ter no máximo 254 caracteres.';
		}

		return !nameError && !emailError;
	}

	async function handleCreate() {
		if (loading || !validate()) {
			return;
		}

		try {
			const result = await oncreate({
				name: name.trim(),
				email: email.trim()
			});

			createdUserName = result.fullName;
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

<Modal title={temporaryPassword ? 'Usuário cadastrado' : 'Adicionar usuário'} onclose={handleClose}>
	{#if temporaryPassword}
		<div class="success-content">
			<p class="description">O solicitante foi cadastrado com sucesso.</p>

			<div class="success-box">
				<strong>{createdUserName}</strong>

				<p>Guarde a senha temporária abaixo. Ela será exibida somente nesta etapa.</p>
			</div>

			<div class="password-box">
				<span class="field-label">Senha temporária</span>

				<strong class="temporary-password">
					{temporaryPassword}
				</strong>
			</div>

			<div class="modal-actions">
				<Button variant="primary" onclick={handleClose}>Concluir</Button>
			</div>
		</div>
	{:else}
		<div class="form-content">
			<p class="description">Cadastre um novo solicitante no MAAT Flow.</p>

			<div class="field">
				<span class="field-label">Nome completo</span>

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
				<span class="field-label">E-mail</span>

				<Input type="email" placeholder="Digite o e-mail" aria-label="E-mail" bind:value={email} />

				{#if emailError}
					<p class="field-error">
						{emailError}
					</p>
				{/if}
			</div>

			<div class="form-row">
				<div class="field">
					<span class="field-label">Perfil</span>

					<div class="readonly-field">Solicitante</div>
				</div>

				<div class="field">
					<span class="field-label">Status</span>

					<div class="readonly-field">Ativo</div>
				</div>
			</div>

			{#if error}
				<p class="form-error" role="alert">
					{error}
				</p>
			{/if}

			<div class="modal-actions">
				<Button variant="outline-neutral" onclick={handleClose} disabled={loading}>Cancelar</Button>

				<Button variant="primary" onclick={handleCreate} {loading}>Cadastrar usuário</Button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.form-content,
	.success-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.description {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
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

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}
	}
</style>
