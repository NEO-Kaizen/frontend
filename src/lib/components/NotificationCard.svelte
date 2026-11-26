<script lang="ts">
	import { describeNotification } from '$lib/services/notification.service';
	import { formatDateTime } from '$lib/utils/dates';
	import type { NotificationItem } from '$lib/types/notification';

	interface Props {
		notification: NotificationItem;
		isMarking: boolean;
		onSelect: (notification: NotificationItem) => void;
	}

	let { notification, isMarking, onSelect }: Props = $props();

	const isUnread = $derived(notification.readAt === null);
	const description = $derived(describeNotification(notification));
	const createdAtLabel = $derived(formatDateTime(notification.createdAt));
</script>

<button
	type="button"
	class="notification-card"
	class:is-unread={isUnread}
	disabled={isMarking}
	aria-label={`${isUnread ? 'Não lida' : 'Lida'}: ${notification.payload.protocol} — ${notification.payload.title}. ${description}`}
	onclick={() => onSelect(notification)}
>
	<span class="card-top">
		<span class="protocol">{notification.payload.protocol}</span>
		{#if isUnread}
			<span class="unread-dot" aria-hidden="true"></span>
		{/if}
	</span>
	<span class="title">{notification.payload.title}</span>
	<span class="description">{description}</span>
	<span class="timestamp">{createdAtLabel}</span>
</button>

<style>
	.notification-card {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 4px;
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-md);
		background-color: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color var(--motion-duration) var(--motion-easing);
	}

	.notification-card:hover:not(:disabled),
	.notification-card:focus-visible {
		background-color: var(--tint);
	}

	.notification-card:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.notification-card.is-unread {
		border-left: 3px solid var(--primary-color);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.protocol {
		font: var(--paragrafo);
		font-size: 12px;
		font-weight: 600;
		color: var(--primary-color);
	}

	@media (prefers-reduced-motion: reduce) {
		.notification-card {
			transition: none;
		}
	}

	.unread-dot {
		width: 8px;
		height: 8px;
		flex-shrink: 0;
		border-radius: 100%;
		background-color: var(--primary-color);
	}

	.title {
		font: var(--paragrafo);
		font-weight: 500;
	}

	.description {
		font: var(--paragrafo);
		font-size: 13px;
		color: var(--gray);
	}

	.timestamp {
		font: var(--paragrafo);
		font-size: 12px;
		color: var(--gray);
	}
</style>
