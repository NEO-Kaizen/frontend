<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import NotificationCenter from '$lib/components/NotificationCenter.svelte';
	import { notificationState } from '$lib/states/notification.svelte';
	import { notifyInfo } from '$lib/utils/feedback';
	import { onDestroy } from 'svelte';
	import { untrack } from 'svelte';

	interface Props {
		userId: string | null;
	}

	let { userId }: Props = $props();

	let isCenterOpen = $state(false);

	// Sino abre/fecha o Centro. Em erro, o clique também tenta recuperar o
	// canal e o contador a partir do banco (o Centro tem retry próprio).
	function handleClick(): void {
		if (notificationState.status === 'error') {
			void notificationState.refresh();
		}

		isCenterOpen = !isCenterOpen;
	}

	function handleClose(): void {
		isCenterOpen = false;
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

	// Chegada via SSE: o state sinaliza em `lastArrived` e o sino toca o
	// toast (o state nunca importa feedback — `states → services e types`).
	$effect(() => {
		const arrived = notificationState.lastArrived;

		if (arrived) {
			const { protocol, title } = arrived.payload;

			untrack(() => {
				notifyInfo(`Nova notificação: ${protocol} — ${title}`);
			});
		}
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
				? 'Notificações: 1 não lida. Ativar para abrir'
				: `Notificações: ${unreadCount} não lidas. Ativar para abrir`;
		}
		return 'Notificações: nenhuma não lida. Ativar para abrir';
	});
</script>

<button
	type="button"
	class="notification-bell"
	class:is-error={isError}
	aria-label={ariaLabel}
	aria-busy={isLoading}
	aria-haspopup="dialog"
	aria-expanded={isCenterOpen}
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

{#if isCenterOpen}
	<NotificationCenter onClose={handleClose} />
{/if}

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
