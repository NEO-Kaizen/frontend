<script lang="ts">
	import type { ConversationRequester } from '$lib/types/conversation';

	interface Props {
		requester: ConversationRequester;
	}

	let { requester }: Props = $props();

	const statusLabel = $derived(requester.isOnline ? 'Online' : 'Offline');
</script>

<div class="conversation-status" role="status">
	<span class="dot" class:online={requester.isOnline} aria-hidden="true"></span>
	<span class="label">{statusLabel}</span>
</div>

<style>
	.conversation-status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 10px;
		border-radius: var(--radius-md);
		background: var(--white);
		border: var(--border-default);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--gray);
	}

	.dot.online {
		background: var(--status-green);
	}

	.label {
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--rich-black);
	}
</style>
