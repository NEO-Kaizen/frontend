<script lang="ts">
	import { verifyPublicAccess } from '$lib/services/requester-tracking.service';
	import type { PublicVerifyPayload } from '$lib/types/requester-tracking';

	interface Props {
		protocol: string;
		onVerified: (identity: { name: string; email: string }) => void;
	}

	let { protocol, onVerified }: Props = $props();

	let name = $state('');
	let email = $state('');
	let fieldError = $state<string | null>(null);
	let submitError = $state<string | null>(null);
	let isValidating = $state(false);

	function handleInput(): void {
		fieldError = null;
		submitError = null;
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (isValidating) return;

		const payload: PublicVerifyPayload = { name, email, protocol };
		isValidating = true;
		submitError = null;
		const result = await verifyPublicAccess(payload);
		isValidating = false;

		if (!result.ok) {
			// Erro genérico do backend (anti-enumeração) — exibido sem detalhar
			// qual dos três dados divergiu.
			submitError = result.error.message;
			return;
		}

		// `canAccess: true`: a página persiste a identidade em `sessionStorage`
		// (`requester-identity.service.ts`) — sem JWT/cookie.
		onVerified({ name: name.trim(), email: email.trim() });
	}
</script>

<section class="validation-card" aria-labelledby="validation-title">
	<h2 id="validation-title">Acompanhar solicitação</h2>
	<p class="validation-hint">
		Para proteger seus dados, confirme sua identidade com os mesmos dados usados na abertura da
		solicitação <strong>{protocol}</strong>.
	</p>

	<form class="validation-form" onsubmit={handleSubmit} novalidate={false}>
		<div class="form-field">
			<label for="validation-name">Nome completo</label>
			<input
				id="validation-name"
				name="name"
				type="text"
				autocomplete="name"
				required
				maxlength={150}
				disabled={isValidating}
				bind:value={name}
				oninput={handleInput}
			/>
		</div>

		<div class="form-field">
			<label for="validation-email">E-mail corporativo</label>
			<input
				id="validation-email"
				name="email"
				type="email"
				autocomplete="email"
				required
				maxlength={254}
				disabled={isValidating}
				bind:value={email}
				oninput={handleInput}
			/>
		</div>

		<div class="form-field">
			<label for="validation-protocol">Protocolo</label>
			<input
				id="validation-protocol"
				name="protocol"
				type="text"
				autocomplete="off"
				required
				maxlength={25}
				disabled={true}
				value={protocol}
				aria-describedby="protocol-hint"
			/>
			<p id="protocol-hint" class="field-hint">Confirmado pela página acessada.</p>
		</div>

		{#if fieldError}
			<p class="form-error" role="alert">{fieldError}</p>
		{/if}
		{#if submitError}
			<p class="form-error" role="alert">{submitError}</p>
		{/if}

		<button type="submit" class="btn-validate" disabled={isValidating} aria-busy={isValidating}>
			{isValidating ? 'Validando…' : 'Validar e acompanhar'}
		</button>
	</form>
</section>

<style>
	.validation-card {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
		padding: var(--spacing-lg);
		max-width: 560px;
		margin: var(--spacing-lg) auto 0 auto;
	}

	.validation-card h2 {
		margin: 0 0 8px 0;
		font-family: var(--font-montserrat);
		font-size: 20px;
		font-weight: 700;
		color: var(--heading-color);
	}

	.validation-hint {
		margin: 0 0 var(--spacing-md) 0;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--gray);
		line-height: 1.5;
	}

	.validation-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-field label {
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--black);
		letter-spacing: 0.02em;
	}

	.form-field input {
		padding: 10px 12px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--black);
		background: var(--white);
	}

	.form-field input:disabled {
		background: var(--background-color);
		color: var(--gray);
		cursor: not-allowed;
	}

	.form-field input:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.field-hint {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.form-error {
		margin: 0;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		background-color: var(--status-red-bg);
		color: var(--status-red);
		border: 1px solid var(--status-red);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
	}

	.btn-validate {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 12px 18px;
		background: var(--primary-color);
		color: var(--on-primary);
		border: none;
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition-default);
	}

	.btn-validate:hover:not(:disabled) {
		background: var(--secondary-color);
	}

	.btn-validate:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-validate:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}
</style>
