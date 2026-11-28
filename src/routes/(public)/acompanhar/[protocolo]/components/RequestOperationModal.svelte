<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { MAX_JUSTIFICATION_LENGTH } from '$lib/utils/validations';

	interface Props {
		protocol: string;
		action: 'cancel' | 'reopen';
		submitting: boolean;
		serverError: string | null;
		onclose: () => void;
		onsubmit: (justification: string) => void;
		onedit: () => void;
	}

	let { protocol, action, submitting, serverError, onclose, onsubmit, onedit }: Props = $props();
	const id = $props.id();
	const isCancelAction = $derived(action === 'cancel');
	const title = $derived(isCancelAction ? 'Cancelar solicitação' : 'Reabrir solicitação');
	const label = $derived(
		isCancelAction ? 'Justificativa do cancelamento' : 'Justificativa da reabertura'
	);
	const confirmLabel = $derived(isCancelAction ? 'Confirmar cancelamento' : 'Confirmar reabertura');
	let reason = $state('');
	const justification = $derived(reason.trim());
	const invalidLength = $derived(justification.length > MAX_JUSTIFICATION_LENGTH);
	const error = $derived(
		invalidLength
			? `Informe uma justificativa de até ${MAX_JUSTIFICATION_LENGTH.toLocaleString('pt-BR')} caracteres.`
			: reason.length > 0 && !justification
				? 'Informe uma justificativa.'
				: serverError
	);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!submitting && justification && !invalidLength) onsubmit(justification);
	}
</script>

<Modal {title} {onclose} trapFocus>
	<form class="operation-form" onsubmit={submit} aria-busy={submitting}>
		<p id={`${id}-protocol`}>Protocolo <strong>{protocol}</strong></p>
		{#if isCancelAction}
			<p>A justificativa do cancelamento será registrada no histórico.</p>
		{/if}
		<label for={`${id}-justification`}>{label}</label>
		<textarea
			id={`${id}-justification`}
			rows={4}
			required
			bind:value={reason}
			oninput={onedit}
			disabled={submitting}
			aria-invalid={Boolean(error)}
			aria-describedby={`${id}-protocol ${id}-count${error ? ` ${id}-error` : ''}`}></textarea>
		<p id={`${id}-count`} class="operation-count">
			{justification.length.toLocaleString('pt-BR')} / {MAX_JUSTIFICATION_LENGTH.toLocaleString(
				'pt-BR'
			)} caracteres
		</p>
		{#if error}
			<p id={`${id}-error`} class="operation-error" role="alert">{error}</p>
		{/if}
		<div class="operation-actions">
			<Button variant="outline-neutral" onclick={onclose} disabled={submitting}>Voltar</Button>
			<Button
				type="submit"
				class={isCancelAction ? 'cancel-confirm' : ''}
				loading={submitting}
				disabled={!justification || invalidLength}
			>
				{submitting ? (isCancelAction ? 'Cancelando…' : 'Reabrindo…') : confirmLabel}
			</Button>
		</div>
	</form>
</Modal>

<style>
	.operation-form {
		display: grid;
		gap: var(--spacing-sm);
		color: var(--text-color-primary);
	}

	p {
		margin: 0;
		overflow-wrap: anywhere;
	}

	label {
		font: var(--label);
	}

	textarea {
		box-sizing: border-box;
		width: 100%;
		resize: vertical;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: inherit;
		font: inherit;
	}

	textarea:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.operation-count {
		font: var(--label);
	}

	.operation-error {
		color: var(--status-red);
	}

	.operation-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
	}

	.operation-actions :global(.cancel-confirm) {
		background: color-mix(in srgb, var(--status-red) 65%, var(--rich-black));
		border-color: transparent;
		color: var(--on-dark);
	}
</style>
