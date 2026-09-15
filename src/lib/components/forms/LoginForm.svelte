<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import { getMe, login } from '$lib/services/auth.service';
	import { getPostLoginRedirect } from '$lib/services/access.service';
	import type { LoginCredentials } from '$lib/types/auth';

	const platformName = $derived(page.data.portalConfig.platformName);
	const loginImageLight = $derived(page.data.portalConfig.assets.loginImageLightUrl);
	const loginImageDark = $derived(page.data.portalConfig.assets.loginImageDarkUrl);
	const returnTo = $derived(page.url.searchParams.get('returnTo'));

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

<form method="post" onsubmit={handleSubmit} novalidate>
	<div
		class="container-banner"
		style:--login-image-light={`url('${loginImageLight}')`}
		style:--login-image-dark={`url('${loginImageDark}')`}
	>
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
			<h1>Bem-vindo ao {platformName}</h1>
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
		background-image: var(--login-image-light);
		background-size: cover;
		background-position: center;
		padding: var(--spacing-xl);
	}
	:global([data-theme='dark']) .container-banner {
		background-image: var(--login-image-dark);
	}
	.container-banner h2,
	.container-banner p {
		color: var(--on-dark);
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
