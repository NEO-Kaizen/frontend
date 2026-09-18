<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatShortDate, formatShortTime } from '$lib/utils/dates';
	import type { ConversationSystemEvent } from '$lib/types/conversation';

	let { event }: { event: ConversationSystemEvent } = $props();
</script>

<li class="conversation-event">
	<span class="event-marker" aria-hidden="true">
		<Icon iconName="info" iconSize="sm" />
	</span>
	<div class="event-content">
		<p class="event-label">{event.label}</p>
		<time class="event-time" datetime={event.createdAt}>
			{formatShortDate(event.createdAt)} às {formatShortTime(event.createdAt)}
		</time>
	</div>
</li>

<style>
	.conversation-event {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		text-align: center;
		padding: var(--spacing-sm) var(--spacing-md);
	}

	.event-marker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--background-color);
		color: var(--gray);
		flex-shrink: 0;
	}

	.event-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		justify-content: center;
	}

	.event-label {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray);
	}

	.event-time {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	@media (prefers-reduced-motion: reduce) {
		.conversation-event {
			transition: none;
		}
	}
</style>
