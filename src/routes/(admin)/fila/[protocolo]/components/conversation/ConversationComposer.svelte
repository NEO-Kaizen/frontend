<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
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
	let attachments = $state<ConversationAttachmentInput[]>([]);
	let isSending = $state(false);
	let sendError = $state<string | null>(null);
	let sendSuccess = $state(false);
	let fileInput: HTMLInputElement | null = null;

	const trimmedContent = $derived(content.trim());
	const canSend = $derived(trimmedContent.length > 0 && !isSending && Boolean(onSend));

	function attachFileInput(node: HTMLInputElement): void {
		fileInput = node;
	}

	function handlePickFiles(event: Event): void {
		const input = event.target as HTMLInputElement;
		for (const file of Array.from(input.files ?? [])) {
			if (!attachments.some((attachment) => attachment.name === file.name)) {
				attachments.push({
					name: file.name,
					mimeType: file.type,
					sizeBytes: file.size
				});
			}
		}
		input.value = '';
	}

	function removeAttachment(name: string): void {
		attachments = attachments.filter((attachment) => attachment.name !== name);
	}

	async function handleSend(): Promise<void> {
		if (!onSend || !trimmedContent || isSending) return;

		isSending = true;
		sendError = null;
		sendSuccess = false;

		const result = await onSend({ content: trimmedContent, attachments });

		isSending = false;

		if (result.ok) {
			content = '';
			attachments = [];
			sendSuccess = true;
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

	<p class="composer-hint">
		O status dessa solicitação irá mudar para &quot;pendente de informações&quot; após o envio.
	</p>

	{#if attachments.length > 0}
		<ul class="composer-attachments">
			{#each attachments as attachment (attachment.name)}
				<li class="composer-attachment">
					<Icon iconName="description" iconSize="sm" ariaLabel="Anexo" />
					<span class="attachment-name">{attachment.name}</span>
					<button
						type="button"
						class="remove-attachment"
						aria-label={`Remover anexo ${attachment.name}`}
						disabled={isSending}
						onclick={() => removeAttachment(attachment.name)}
					>
						<Icon iconName="close" iconSize="sm" ariaLabel="Remover" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if sendError}
		<p class="composer-feedback composer-error" role="alert">{sendError}</p>
	{/if}
	{#if sendSuccess}
		<p class="composer-feedback composer-success" role="status">Mensagem enviada.</p>
	{/if}

	<div class="composer-actions">
		<button
			type="button"
			class="attach-button"
			disabled={isSending}
			onclick={() => fileInput?.click()}
		>
			<Icon iconName="cloudUpload" iconSize="sm" ariaLabel="Anexar arquivo" />
			<span>Solicitar Anexo</span>
		</button>
		<input
			{@attach attachFileInput}
			type="file"
			class="sr-only"
			multiple
			tabindex="-1"
			onchange={handlePickFiles}
		/>
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

	.composer-hint {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.composer-attachments {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.composer-attachment {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		background: var(--background-color);
		border: var(--border-default);
		color: var(--secondary-color);
		min-width: 0;
		max-width: 100%;
	}

	.attachment-name {
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 500;
		color: var(--rich-black);
		overflow-wrap: anywhere;
	}

	.remove-attachment {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		border: none;
		background: none;
		color: var(--gray);
		cursor: pointer;
		border-radius: 4px;
	}

	.remove-attachment:hover {
		color: var(--status-red);
	}

	.remove-attachment:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.remove-attachment:disabled {
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

	.composer-success {
		background-color: var(--status-green-bg);
		color: var(--status-green);
		border: 1px solid var(--status-green);
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
