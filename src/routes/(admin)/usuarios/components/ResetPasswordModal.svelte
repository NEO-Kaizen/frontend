<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { resetUserPassword } from '$lib/services/user.service';
	import type { AdminUser } from '$lib/types/user';

	interface Props {
		user: AdminUser;
		onclose: () => void;
	}

	let { user, onclose }: Props = $props();

	let isResetting = $state(false);
	let submitError = $state('');
	let temporaryPassword = $state('');
	let isDone = $derived(temporaryPassword !== '');

	async function handleConfirm() {
		isResetting = true;
		submitError = '';

		const result = await resetUserPassword(user.id);

		isResetting = false;

		if (result.ok) {
			temporaryPassword = result.data.temporaryPassword;
			return;
		}

		submitError = result.error.message;
	}
</script>

<Modal title="Redefinir senha" {onclose}>
	{#if isDone}
		<div class="result-box">
			<span class="result-icon" aria-hidden="true">
				<Icon iconName="lock" iconSize="lg" />
			</span>
			<label for="temporary-password">Senha temporária de {user.name}</label>
			<p id="temporary-password" class="temporary-password">{temporaryPassword}</p>
			<CopyButton text={temporaryPassword} />
			<p class="warning">Guarde esta senha. Ela não será exibida novamente.</p>
		</div>

		<div class="modal-actions">
			<Button variant="primary" onclick={onclose}>Concluir</Button>
		</div>
	{:else}
		<p class="confirm-message">
			Será gerada uma nova senha temporária para <strong>{user.name}</strong>. Ela será exibida
			apenas uma vez nesta tela.
		</p>

		{#if submitError}
			<p class="form-error" role="alert">{submitError}</p>
		{/if}

		<div class="modal-actions">
			<Button variant="outline-neutral" onclick={onclose} disabled={isResetting}>Cancelar</Button>
			<Button variant="primary" onclick={handleConfirm} loading={isResetting}>
				Gerar senha temporária
			</Button>
		</div>
	{/if}
</Modal>

<style>
	.confirm-message {
		margin: 0;
		font: var(--paragrafo);
	}

	.form-error {
		margin: var(--spacing-md) 0 0;
		font: var(--paragrafo);
		color: var(--status-red);
	}

	.result-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		text-align: center;
		padding: var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--status-blue-bg);
	}

	.result-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background-color: var(--white);
		color: var(--status-blue);
	}

	.result-box label {
		font: var(--label);
		color: var(--black);
	}

	.temporary-password {
		margin: 0;
		font: var(--label);
		font-size: 20px;
		letter-spacing: 0.05em;
		color: var(--text-color-primary);
		word-break: break-all;
	}

	.warning {
		margin: 0;
		font: var(--label);
		font-size: 13px;
		color: var(--status-yellow);
		font-weight: 600;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-lg);
	}
</style>
