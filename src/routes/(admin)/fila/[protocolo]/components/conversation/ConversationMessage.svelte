<script lang="ts">
	import avatarDefault from '$lib/assets/avatar-default.svg';
	import Icon from '$lib/components/Icon.svelte';
	import { formatDateTime } from '$lib/utils/dates';
	import type { ConversationMessage as ConversationMessageEntity } from '$lib/types/conversation';

	interface Props {
		message: ConversationMessageEntity;
	}

	let { message }: Props = $props();

	const isAnalyst = $derived(message.authorType === 'analyst');
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- links de anexo usam URL dinâmica do backend, não rotas do app -->
<li class="message-row" class:from-analyst={isAnalyst} class:from-requester={!isAnalyst}>
	<img
		class="avatar"
		src={avatarDefault}
		alt={`Avatar de ${message.authorName}`}
		width="40"
		height="40"
	/>
	<div class="message-stack">
		<div class="message-meta">
			<span class="author-name">{message.authorName}</span>
			{#if message.authorRole}
				<span class="author-role">{message.authorRole}</span>
			{/if}
			<time class="message-time" datetime={message.createdAt}>
				{formatDateTime(message.createdAt)}
			</time>
		</div>
		<div class="bubble">
			<p class="bubble-text">{message.content}</p>
			{#if message.attachments && message.attachments.length > 0}
				<ul class="attachment-list">
					{#each message.attachments as attachment (attachment.id)}
						<li class="attachment-item">
							<Icon iconName="description" iconSize="sm" ariaLabel="Anexo" />
							{#if attachment.url && attachment.canDownload}
								<a
									class="attachment-link"
									href={attachment.url}
									download
									title="Baixar anexo {attachment.name}"
								>
									{attachment.name}
								</a>
							{:else}
								<span class="attachment-name">{attachment.name}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</li>

<style>
	.message-row {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-sm);
		width: 100%;
		min-width: 0;
		list-style: none;
	}

	.message-row.from-analyst {
		flex-direction: row-reverse;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.message-stack {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		max-width: min(78%, 480px);
	}

	.message-row.from-analyst .message-stack {
		align-items: flex-end;
	}

	.message-meta {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		padding: 0 4px;
	}

	.message-row.from-requester .message-meta {
		justify-content: flex-start;
	}

	.message-row.from-analyst .message-meta {
		justify-content: flex-end;
	}

	.author-name {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--rich-black);
	}

	.author-role {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 500;
		color: var(--gray);
	}

	.message-time {
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
	}

	.bubble {
		padding: 10px 14px;
		border-radius: var(--radius-md);
		border: var(--border-default);
		background: var(--white);
		min-width: 0;
		max-width: 100%;
	}

	.bubble-text {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		line-height: 1.5;
		color: var(--rich-black);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.from-analyst .bubble {
		background: var(--primary-color);
		border-color: var(--primary-color);
	}

	.from-analyst .bubble-text {
		color: var(--white);
	}

	.attachment-list {
		list-style: none;
		margin: var(--spacing-sm) 0 0 0;
		padding: var(--spacing-sm) 0 0 0;
		border-top: 1px solid var(--white-gray);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.from-analyst .attachment-list {
		border-top-color: rgba(255, 255, 255, 0.25);
	}

	.attachment-item {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		color: var(--secondary-color);
	}

	.from-analyst .attachment-item {
		color: var(--white);
	}

	.attachment-link,
	.attachment-name {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 500;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.attachment-link {
		color: var(--secondary-color);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.from-analyst .attachment-link {
		color: var(--white);
	}

	.attachment-name {
		color: var(--gray);
	}

	.from-analyst .attachment-name {
		color: rgba(255, 255, 255, 0.85);
	}

	.attachment-item:focus-within {
		outline: none;
	}

	.attachment-link:focus-visible,
	.attachment-name:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 2px;
	}

	@media (max-width: 640px) {
		.message-stack {
			max-width: 85%;
		}

		.avatar {
			width: 32px;
			height: 32px;
		}
	}
</style>
