<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		title?: string;
		message?: string;
		hint?: string;
	}

	let {
		title = 'Não encontrado',
		message = 'Não encontramos informações para esta consulta.',
		hint = 'Verifique os dados informados e tente novamente.'
	}: Props = $props();
</script>

<div class="not-found-card">
	<div class="icon-wrapper">
		<Icon iconName="searchOff" iconSize="lg" />
	</div>
	<h2>{title}</h2>
	<p>{message}</p>

	{#if hint}
		<p class="hint">{hint}</p>
	{/if}
</div>

<style>
	.not-found-card {
		background: #ffffff;
		border-radius: 8px;
		padding: 32px 24px;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-top: 24px;
	}

	.icon-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background-color: #f1f5f9;
		color: #64748b;
		border-radius: 50%;
		margin-bottom: 16px;
	}

	h2 {
		margin: 0 0 8px 0;
		font-size: 1.25rem;
		color: #0f172a;
	}

	p {
		margin: 0 0 8px 0;
		color: #475569;
		font-size: 0.95rem;
	}

	.hint {
		font-size: 0.85rem;
		color: #64748b;
		margin-bottom: 0;
	}
</style>
