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
		<Icon iconName="search" iconSize="lg" />
	</div>
	<h2>{title}</h2>
	<p>{message}</p>

	{#if hint}
		<p class="hint">{hint}</p>
	{/if}
</div>

<style>
	.not-found-card {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		text-align: center;
		box-shadow: var(--regular-shadow);
		margin-top: var(--spacing-lg);
	}

	.icon-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background-color: var(--background-color);
		color: var(--primary-color);
		border-radius: 50%;
		margin-bottom: var(--spacing-md);
	}

	h2 {
		margin: 0 0 var(--spacing-sm) 0;
		font: var(--h3);
		color: var(--heading-color);
	}

	p {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--black);
		font: var(--paragrafo);
	}

	.hint {
		font: var(--paragrafo);
		color: var(--gray);
		margin-bottom: 0;
	}
</style>
