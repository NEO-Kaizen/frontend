<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import type { ConversationAttachmentInput, ConversationMessage } from '$lib/types/conversation';
	import type { Result } from '$lib/types/result';

	interface Props {
		onSend?: (input: {
			content: string;
			attachments: ConversationAttachmentInput[];
		}) => Promise<Result<ConversationMessage>>;
	}

	let { onSend }: Props = $props();

	let content = $state('');
	let isSending = $state(false);
	let sendError = $state<string | null>(null);

	const trimmedContent = $derived(content.trim());

	const canSend = $derived(trimmedContent.length > 0 && !isSending && Boolean(onSend));

	async function handleSend(): Promise<void> {
		if (!onSend || !trimmedContent || isSending) return;

		isSending = true;
		sendError = null;

		const result = await onSend({
			content: trimmedContent,
			attachments: []
		});

		isSending = false;

		if (result.ok) {
			content = '';
			toastState.add('Mensagem enviada.', 'success');
		} else {
			sendError = result.error.message;
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void handleSend();
		}
	}
</script>

<div class="composer">
	<textarea
		class="composer-input"
		placeholder="Escreva sua mensagem…"
		rows="3"
		bind:value={content}
		disabled={isSending}
		aria-label="Mensagem para o solicitante"
		onkeydown={handleKeydown}></textarea>

	{#if sendError}
		<p class="composer-feedback composer-error" role="alert">
			{sendError}
		</p>
	{/if}

	<div class="composer-actions">
		<button
			type="button"
			class="attach-button"
			disabled
			aria-disabled="true"
			title="Fluxo de solicitação de anexo aguardando definição"
		>
			<Icon iconName="cloudUpload" iconSize="sm" ariaLabel="Solicitar anexo" />
			<span>Solicitar Anexo</span>
		</button>

		<Button
			variant="primary"
			loading={isSending}
			disabled={!canSend}
			onclick={() => void handleSend()}
		>
			<span>Solicitar Informações</span>
			<Icon iconName="send" iconSize="sm" ariaLabel="Enviar mensagem" />
		</Button>
	</div>
</div>

<style>
	.composer {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
		min-width: 0;
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--white-gray);
	}

	.composer-input {
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 14px;
		line-height: 1.5;
		background-color: var(--white);
		color: var(--rich-black);
		outline: none;
		resize: vertical;
		transition: border-color 150ms ease;
	}

	.composer-input::placeholder {
		color: var(--gray);
	}

	.composer-input:focus-visible {
		border-color: var(--primary-color);
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.composer-input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.composer-feedback {
		margin: 0;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
	}

	.composer-error {
		background-color: var(--status-red-bg);
		color: var(--status-red);
		border: 1px solid var(--status-red);
	}

	.composer-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.attach-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: 12px;
		border: var(--border-default);
		background: var(--white);
		color: var(--rich-black);
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.attach-button:hover:not(:disabled) {
		background: var(--background-color);
	}

	.attach-button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.attach-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	@media (max-width: 640px) {
		.composer-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.composer-actions :global(button) {
			width: 100%;
			justify-content: center;
		}
	}
</style>
