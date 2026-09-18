<script lang="ts">
	import ConversationEvent from './ConversationEvent.svelte';
	import ConversationMessage from './ConversationMessage.svelte';
	import PendencyCard from './PendencyCard.svelte';
	import type { ConversationItem } from '$lib/types/conversation';

	interface Props {
		items: ConversationItem[];
		onValidate?: (id: string) => void | Promise<void>;
		onRequestAgain?: (id: string) => void | Promise<void>;
	}

	let { items, onValidate, onRequestAgain }: Props = $props();

	const sortedItems = $derived(
		[...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
	);
</script>

<ul class="conversation-thread">
	{#each sortedItems as item (item.id)}
		{#if item.type === 'message'}
			<ConversationMessage message={item} />
		{:else if item.type === 'system'}
			<ConversationEvent event={item} />
		{:else}
			<PendencyCard pendency={item} {onValidate} {onRequestAgain} />
		{/if}
	{/each}
</ul>

<style>
	.conversation-thread {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
		min-width: 0;
	}
</style>
