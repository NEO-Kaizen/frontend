<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { notificationState } from '$lib/states/notification.svelte';
	import { onDestroy } from 'svelte';
	import { untrack } from 'svelte';

	interface Props {
		userId: string | null;
	}

	let { userId }: Props = $props();

	// TODO(#234): abrir o Centro de não lidas. Nesta issue o clique apenas
	// recarrega o contador a partir do banco (e recupera o canal em erro).
	function handleClick(): void {
		void notificationState.refresh();
	}

	$effect(() => {
		const id = userId;

		untrack(() => {
			void notificationState.initialize(id);
		});
	});

	onDestroy(() => {
		notificationState.disconnect();
	});

	const isLoading = $derived(
		notificationState.status === 'idle' || notificationState.status === 'loading'
	);
	const isError = $derived(notificationState.status === 'error');
	const unreadCount = $derived(notificationState.unreadCount);
	const hasUnread = $derived(unreadCount > 0);
	const displayCount = $derived(unreadCount > 99 ? '99+' : String(unreadCount));

	const ariaLabel = $derived.by(() => {
		if (isLoading) return 'Carregando notificações';
		if (isError) return 'Notificações indisponíveis. Ativar para tentar novamente';
		if (hasUnread) {
			return unreadCount === 1
				? 'Notificações: 1 não lida. Ativar para atualizar'
				: `Notificações: ${unreadCount} não lidas. Ativar para atualizar`;
		}
		return 'Notificações: nenhuma não lida. Ativar para atualizar';
	});
</script>

<button
	type="button"
	class="notification-bell"
	class:is-error={isError}
	aria-label={ariaLabel}
	aria-busy={isLoading}
	title={isError ? 'Não foi possível carregar as notificações' : 'Notificações'}
	onclick={handleClick}
>
	<Icon iconName="notifications" />
	{#if hasUnread && !isLoading}
		<span class="badge" role="status" aria-live="polite">{displayCount}</span>
	{/if}
	{#if isError}
		<span class="error-dot" aria-hidden="true"></span>
	{/if}
</button>

<style>
	.notification-bell {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: var(--border-default);
		border-radius: 100%;
		background-color: transparent;
		color: var(--primary-color);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.notification-bell:hover,
	.notification-bell:focus-visible {
		background-color: var(--tint);
	}

	.notification-bell.is-error {
		border-color: var(--status-yellow);
	}

	.badge {
		position: absolute;
		top: -4px;
		right: -4px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		border-radius: 999px;
		background-color: var(--status-red);
		color: var(--on-dark);
		font-size: 12px;
		font-weight: 600;
		line-height: 1;
	}

	.error-dot {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 10px;
		height: 10px;
		border-radius: 100%;
		background-color: var(--status-yellow);
	}
</style>
