<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { login } from '$lib/services/auth.service';
	import type { LoginCredentials } from '$lib/types/auth';
    

	type FieldName = 'email' | 'password';

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
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
			await goto('/');
			return;
		}

		// TODO: o service mapeia qualquer erro HTTP como "Credenciais inválidas."
		// Quando o backend estiver disponível, diferenciar 401 (credenciais inválidas)
		// de outros status (erro inesperado) para exibir mensagens mais precisas.
		errorMessage = result.error.message;
	}
</script>

<form onsubmit={handleSubmit} novalidate>
	<Input
		id="email"
		label="E-mail"
		type="email"
		bind:value={email}
		placeholder="voce@empresa.com"
		autocomplete="email"
		required
		error={fieldErrors.email}
		iconName="email"
		oninput={() => clearFieldError('email')}
	/>

	<Input
		id="password"
		label="Senha"
		type="password"
		bind:value={password}
		placeholder="Sua senha"
		autocomplete="current-password"
		required
		error={fieldErrors.password}
		iconName="lock"
		oninput={() => clearFieldError('password')}
	/>

	{#if errorMessage}
		<p class="form-error" role="alert">{errorMessage}</p>
	{/if}

	<Button type="submit" size="full" loading={isSubmitting}>
		Entrar
	</Button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.form-error {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background-color: var(--status-red-bg);
		color: var(--status-red);
	}
</style>