<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import { changePassword, getMe } from '$lib/services/auth.service';
	import { getPostLoginRedirect } from '$lib/services/access.service';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { page } from '$app/state';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	const returnTo = page.url.searchParams.get('returnTo');

	// O texto se adapta ao motivo da visita: troca obrigatória no primeiro
	// acesso (mustChangePassword) ou alteração voluntária (ex.: vinda de /perfil).
	const mustChangePassword = $derived(page.data.user?.mustChangePassword ?? false);

	type FieldName = 'currentPassword' | 'newPassword' | 'confirmPassword';
	let fieldErrors = $state<Partial<Record<FieldName, string>>>({});

	const MIN_PASSWORD_LENGTH = 8;

	function validate(): boolean {
		const errors: Partial<Record<FieldName, string>> = {};

		if (!currentPassword) {
			errors.currentPassword = 'Informe sua senha atual.';
		}

		if (!newPassword) {
			errors.newPassword = 'Informe a nova senha.';
		} else if (newPassword.length < MIN_PASSWORD_LENGTH) {
			errors.newPassword = `A nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
		}

		if (!confirmPassword) {
			errors.confirmPassword = 'Confirme a nova senha.';
		} else if (confirmPassword !== newPassword) {
			errors.confirmPassword = 'As senhas não conferem.';
		}

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function clearFieldError(field: FieldName) {
		errorMessage = '';
		fieldErrors[field] = undefined;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (isSubmitting) return;

		errorMessage = '';

		if (!validate()) return;

		isSubmitting = true;

		const result = await changePassword({
			currentPassword,
			newPassword,
			confirmNewPassword: confirmPassword
		});

		if (!result.ok) {
			isSubmitting = false;
			errorMessage = result.error.message;
			return;
		}

		const meResult = await getMe();

		isSubmitting = false;

		if (!meResult.ok) {
			errorMessage = meResult.error.message;
			return;
		}

		const redirectPath = getPostLoginRedirect(meResult.data, returnTo);
		await goto(resolve(redirectPath), { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{mustChangePassword ? 'Redefinir Senha' : 'Alterar Senha'}</title>
</svelte:head>

<main class="password-change-page">
	<div class="password-change-card">
		<div class="card-header">
			<h1>{mustChangePassword ? 'Redefinir Senha' : 'Alterar Senha'}</h1>
			<p>
				{mustChangePassword
					? 'Por segurança, é necessário alterar sua senha no primeiro acesso.'
					: 'Defina uma nova senha para sua conta.'}
			</p>
		</div>

		<form onsubmit={handleSubmit} novalidate>
			<div class="card-body">
				<Input
					type={showCurrentPassword ? 'text' : 'password'}
					name="currentPassword"
					label="Senha atual"
					placeholder="Digite sua senha atual"
					icon="lock"
					actionIcon={showCurrentPassword ? 'visibilityOff' : 'visibility'}
					actionLabel={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
					onAction={() => (showCurrentPassword = !showCurrentPassword)}
					autocomplete="current-password"
					required
					bind:value={currentPassword}
					error={fieldErrors.currentPassword}
					oninput={() => clearFieldError('currentPassword')}
				/>

				<Input
					type={showNewPassword ? 'text' : 'password'}
					name="newPassword"
					label="Nova senha"
					placeholder="Digite a nova senha"
					icon="lock"
					actionIcon={showNewPassword ? 'visibilityOff' : 'visibility'}
					actionLabel={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
					onAction={() => (showNewPassword = !showNewPassword)}
					autocomplete="new-password"
					required
					bind:value={newPassword}
					error={fieldErrors.newPassword}
					oninput={() => clearFieldError('newPassword')}
				/>

				<Input
					type={showNewPassword ? 'text' : 'password'}
					name="confirmPassword"
					label="Confirmar nova senha"
					placeholder="Repita a nova senha"
					icon="lock"
					autocomplete="new-password"
					required
					bind:value={confirmPassword}
					error={fieldErrors.confirmPassword}
					oninput={() => clearFieldError('confirmPassword')}
				/>

				{#if errorMessage}
					<p class="form-message form-message--error" role="alert">{errorMessage}</p>
				{/if}
			</div>

			<div class="card-footer">
				<Button variant="primary" type="submit" size="full" loading={isSubmitting}>
					Alterar senha
					<Icon iconName="lock" iconSize="md" />
				</Button>
			</div>
		</form>
	</div>
</main>

<Footer />

<style>
	.password-change-page {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-lg);
	}

	.password-change-card {
		width: 100%;
		max-width: 440px;
		background-color: var(--white);
		border-radius: var(--radius-xl);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.card-header {
		padding: var(--spacing-xl) var(--spacing-xl) 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.card-header h1 {
		font: var(--h2);
	}

	.card-header p {
		font: var(--paragrafo);
		color: var(--gray);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		padding: var(--spacing-xl);
	}

	.card-footer {
		padding: 0 var(--spacing-xl) var(--spacing-xl);
	}

	.form-message {
		text-align: center;
		font: var(--label);
	}

	.form-message--error {
		color: var(--status-red);
	}
</style>
