<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		title?: string;
		message: string;
		hint?: string;
	}

	let { title = 'Solicitação não encontrada', message, hint }: Props = $props();
</script>

<div class="not-found-card" role="alert">
	<div class="icon-wrapper">
		<Icon iconName="info" iconSize="xl" />
	</div>
	<h2>{title}</h2>
	<p>{@html message}</p>
	{#if hint}
		<p class="hint">{hint}</p>
	{/if}
</div>

<style>
	.not-found-card {
		background: #ffffff;
		border-radius: 8px;
		padding: 48px 24px;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.icon-wrapper {
		display: flex;
		justify-content: center;
		margin-bottom: 12px;
		color: #64748b;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #0f172a;
		margin-bottom: 8px;
	}

	p {
		color: #475569;
		margin-bottom: 8px;
	}

	.hint {
		color: #64748b;
		font-size: 0.875rem;
	}
</style>
