<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import { login } from '$lib/services/auth.service';
	import type { LoginCredentials } from '$lib/types/auth';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	type FieldName = 'email' | 'password';
	let fieldErrors = $state<Partial<Record<FieldName, string>>>({});

	const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	function validate(): boolean {
		const errors: Partial<Record<FieldName, string>> = {};

		if (!email.trim()) {
			errors.email = 'Informe seu e-mail.';
		} else if (!EMAIL_PATTERN.test(email)) {
			errors.email = 'Informe um e-mail válido.';
		}

		if (!password) {
			errors.password = 'Informe sua senha.';
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

		const credentials: LoginCredentials = { email: email.trim(), password };
		const result = await login(credentials);

		isSubmitting = false;

		if (result.ok) {
			// A home decide o destino por perfil (redirect server-side em (public)/+page.server.ts)
			await goto(resolve('/'), { invalidateAll: true });
			return;
		}
		errorMessage = result.error.message;
	}
</script>

<form onsubmit={handleSubmit} novalidate>
	<div class="container-banner">
		<h2>Potencializando a Gestão Inteligente.</h2>
		<span style="display: flex; align-items: center; gap: var(--spacing-sm);">
			<svg xmlns="http://www.w3.org/2000/svg" width="48" height="2" viewBox="0 0 48 2" fill="none">
				<rect width="48" height="2" fill="#D8E2FF" />
			</svg>
			<p>EXCELÊNCIA CORPORATIVA</p>
		</span>
	</div>
	<div class="container-form">
		<div class="container-titulo">
			<h1>Bem-vindo ao NEO</h1>
			<p>Insira suas credenciais.</p>
		</div>

		<div class="container-input">
			<Input
				type="email"
				name="email"
				label="E-mail"
				placeholder="voce@empresa.com"
				icon="email"
				autocomplete="email"
				required
				bind:value={email}
				error={fieldErrors.email}
				oninput={() => clearFieldError('email')}
			/>

			<Input
				type={showPassword ? 'text' : 'password'}
				name="password"
				label="Senha"
				icon="lock"
				placeholder="Digite sua senha"
				actionIcon={showPassword ? 'visibilityOff' : 'visibility'}
				actionLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
				onAction={() => (showPassword = !showPassword)}
				autocomplete={showPassword ? 'off' : 'current-password'}
				required
				bind:value={password}
				error={fieldErrors.password}
				oninput={() => clearFieldError('password')}
			/>
			{#if errorMessage}
				<p class="form-error" role="alert">{errorMessage}</p>
			{/if}
		</div>

		<Button variant="primary" type="submit" size="full" loading={isSubmitting}>
			Entrar
			<Icon iconName="login" iconSize="md" />
		</Button>
	</div>
</form>

<style>
	form {
		width: 100%;
		display: flex;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		border-radius: var(--radius-xl);
		overflow: hidden;
		background-color: var(--white);
	}

	h1 {
		font: var(--h2);
	}

	h2 {
		font: var(--h1);
	}

	.container-banner {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		width: 50%;
		gap: var(--spacing-xl);
		background-image: url('$lib/assets/login.png');
		background-size: cover;
		background-position: center;
		padding: var(--spacing-xl);
	}
	.container-banner h2,
	.container-banner p {
		color: var(--white);
	}
	.container-form {
		width: 50%;
		gap: var(--spacing-xl);
		display: flex;
		flex-direction: column;
		padding: 100px 64px;
	}
	.container-input {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		position: relative;
	}
	.container-titulo {
		gap: var(--spacing-sm);
		display: flex;
		flex-direction: column;
	}

	.form-error {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		margin-top: 12px;
		text-align: center;
		color: var(--status-red);
		font: var(--label);
	}
</style>
