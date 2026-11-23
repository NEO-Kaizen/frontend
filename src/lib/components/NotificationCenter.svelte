<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import NotificationCard from '$lib/components/NotificationCard.svelte';
	import { resolveNotificationTarget } from '$lib/services/access.service';
	import { notificationState } from '$lib/states/notification.svelte';
	import { notifyError } from '$lib/utils/feedback';
	import type { NotificationItem } from '$lib/types/notification';
	import { onMount } from 'svelte';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const currentUser = $derived(page.data.user);

	let markingId = $state<string | null>(null);
	let isMarkingAll = $state(false);

	onMount(() => {
		void notificationState.loadCenter();
	});

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Clique no card: marca como lida e navega para a solicitação. Sem
	// confirmação da API não navega — o contador passeia junto com o banco.
	async function handleSelect(notification: NotificationItem): Promise<void> {
		if (markingId !== null || isMarkingAll || !currentUser) return;

		markingId = notification.id;

		try {
			const result = await notificationState.markRead(notification.id);

			if (!result.ok) {
				notifyError(result.error.message);
				return;
			}

			onClose();

			// O destino já vem resolvido de `resolveNotificationTarget`
			// (access.service centraliza `resolve()` + regra de perfil).
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(resolveNotificationTarget(currentUser, notification.payload.protocol));
		} finally {
			markingId = null;
		}
	}

	async function handleMarkAll(): Promise<void> {
		if (isMarkingAll || markingId !== null) return;

		isMarkingAll = true;

		try {
			const result = await notificationState.markAllRead();

			if (!result.ok) {
				notifyError(result.error.message);
			}
		} finally {
			isMarkingAll = false;
		}
	}

	async function handleLoadMore(): Promise<void> {
		const result = await notificationState.loadMore();

		if (!result.ok) {
			notifyError(result.error.message);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<button
	type="button"
	class="center-backdrop"
	aria-label="Fechar centro de notificações"
	onclick={onClose}
></button>

<div
	class="notification-center"
	role="dialog"
	aria-modal="true"
	aria-label="Centro de notificações"
>
	<header class="center-header">
		<h2 class="center-title">Notificações</h2>
		<div class="center-actions">
			<button
				type="button"
				class="mark-all-btn"
				disabled={isMarkingAll || notificationState.unreadCount === 0}
				aria-busy={isMarkingAll}
				onclick={handleMarkAll}
			>
				Marcar todas como lidas
			</button>
			<button
				type="button"
				class="close-btn"
				aria-label="Fechar centro de notificações"
				onclick={onClose}
			>
				<Icon iconName="close" iconSize="sm" />
			</button>
		</div>
	</header>

	<div class="center-body">
		{#if notificationState.centerStatus === 'loading' || notificationState.centerStatus === 'idle'}
			<p class="sr-only" role="status" aria-live="polite">Carregando notificações…</p>
			<ul
				class="center-list center-list-skeleton"
				aria-hidden="true"
				data-testid="notification-list-skeleton"
			>
				{#each [0, 1, 2] as index (index)}
					<li class="skeleton-card">
						<span class="skeleton-line skeleton-protocol"></span>
						<span class="skeleton-line skeleton-title"></span>
						<span class="skeleton-line skeleton-description"></span>
						<span class="skeleton-line skeleton-date"></span>
					</li>
				{/each}
			</ul>
		{:else if notificationState.centerStatus === 'error'}
			<p class="center-feedback" role="alert">Não foi possível carregar as notificações.</p>
			<button type="button" class="retry-btn" onclick={() => notificationState.loadCenter()}>
				Tentar novamente
			</button>
		{:else if notificationState.items.length === 0}
			<p class="center-feedback" role="status">Nenhuma notificação por aqui.</p>
		{:else}
			<ul class="center-list">
				{#each notificationState.items as notification (notification.id)}
					<li>
						<NotificationCard
							{notification}
							isMarking={markingId === notification.id || isMarkingAll}
							onSelect={handleSelect}
						/>
					</li>
				{/each}
			</ul>

			{#if notificationState.isLoadingMore}
				<ul
					class="center-list center-list-skeleton"
					aria-hidden="true"
					data-testid="notification-list-more-skeleton"
				>
					{#each [0, 1] as index (index)}
						<li class="skeleton-card">
							<span class="skeleton-line skeleton-protocol"></span>
							<span class="skeleton-line skeleton-title"></span>
							<span class="skeleton-line skeleton-description"></span>
							<span class="skeleton-line skeleton-date"></span>
						</li>
					{/each}
				</ul>
			{/if}

			{#if notificationState.nextCursor !== null}
				<button
					type="button"
					class="load-more-btn"
					disabled={notificationState.isLoadingMore}
					aria-busy={notificationState.isLoadingMore}
					onclick={handleLoadMore}
				>
					{notificationState.isLoadingMore ? 'Carregando…' : 'Carregar mais'}
				</button>
			{/if}
		{/if}
	</div>
</div>

<style>
	.center-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background-color: transparent;
		border: none;
		padding: 0;
		cursor: default;
	}

	.notification-center {
		position: fixed;
		top: 76px;
		right: 24px;
		z-index: 41;
		display: flex;
		flex-direction: column;
		width: min(380px, calc(100vw - 48px));
		max-height: min(480px, calc(100vh - 100px));
		border: var(--border-default);
		border-radius: var(--radius-md);
		background-color: var(--white);
		box-shadow: var(--regular-shadow);
		overflow: hidden;
	}

	.center-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		border-bottom: var(--border-default);
	}

	.center-title {
		margin: 0;
		font: var(--h1);
		font-size: 16px;
	}

	.center-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.mark-all-btn {
		border: none;
		background: none;
		padding: 0;
		font: var(--paragrafo);
		font-size: 13px;
		color: var(--primary-color);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.mark-all-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
		text-decoration: none;
	}

	.close-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: var(--border-default);
		border-radius: 100%;
		background-color: transparent;
		color: var(--primary-color);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.close-btn:hover,
	.close-btn:focus-visible {
		background-color: var(--tint);
	}

	.center-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		overflow-y: auto;
	}

	.center-feedback {
		margin: var(--spacing-md) 0;
		font: var(--paragrafo);
		color: var(--gray);
		text-align: center;
	}

	.retry-btn,
	.load-more-btn {
		align-self: center;
		border: var(--border-default);
		border-radius: var(--radius-md);
		background-color: transparent;
		color: var(--primary-color);
		font: var(--paragrafo);
		font-size: 13px;
		padding: var(--spacing-sm) var(--spacing-md);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.retry-btn:hover:not(:disabled),
	.retry-btn:focus-visible,
	.load-more-btn:hover:not(:disabled),
	.load-more-btn:focus-visible {
		background-color: var(--tint);
	}

	.retry-btn:disabled,
	.load-more-btn:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.skeleton-card {
		display: flex;
		flex-direction: column;
		gap: 9px;
		padding: var(--spacing-sm) var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-md);
		min-height: 104px;
	}

	.skeleton-line {
		display: block;
		height: 10px;
		border-radius: 4px;
		background: var(--white-gray);
		animation: skeleton-pulse var(--notification-skeleton-duration) ease-in-out infinite;
	}

	.skeleton-protocol {
		width: 34%;
	}
	.skeleton-title {
		width: 76%;
	}
	.skeleton-description {
		width: 91%;
	}
	.skeleton-date {
		width: 28%;
	}

	@keyframes skeleton-pulse {
		50% {
			opacity: 0.45;
		}
	}

	.center-list > li:not(.skeleton-card) {
		animation: notification-appear var(--notification-motion-duration)
			var(--notification-motion-easing) both;
	}

	@keyframes notification-appear {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-line,
		.center-list > li:not(.skeleton-card) {
			animation: none;
		}
	}

	.center-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
