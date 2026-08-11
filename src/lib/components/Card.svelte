<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		title?: string;
		description?: string;
		buttonText?: string;
		iconName?: IconName;
		buttonIconName?: IconName;
		href?: string;
		onAction?: () => void;
	}

	let {
		title = 'Abrir Solicitação',
		description = 'Inicie um novo chamado ou\nrequerimento administrativo.\nNosso fluxo guiado ajudará\nvocê a fornecer os detalhes\nnecessários.',
		buttonText = 'Iniciar formulário',
		iconName = 'add_circle',
		buttonIconName = 'arrow_forward',
		href,
		onAction
	}: Props = $props();
</script>

<div class="card">
	<div class="card-content">
		<div class="icon-container">
			<Icon {iconName} iconSize="lg" />
		</div>

		<h3>{title}</h3>

		<pre class="description">{description}</pre>
	</div>

	{#if href}
		<a {href} class="action-btn">
			{buttonText}
			<Icon iconName={buttonIconName} iconSize="sm" />
		</a>
	{:else}
		<button type="button" class="action-btn" onclick={onAction}>
			{buttonText}
			<Icon iconName={buttonIconName} iconSize="sm" />
		</button>
	{/if}
</div>

<style>
	.card {
		background: linear-gradient(180deg, #002068 0%, #003399 100%);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
		max-width: 410.67px;
		height: 400px;
		box-shadow: var(--regular-shadow);
		box-sizing: border-box;
		transition: var(--transition-default);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-md);
		width: 100%;
	}

	.icon-container {
		width: 56px;
		height: 56px;
		border-radius: var(--radius-md);
		border: 1px solid rgba(255, 255, 255, 0.2);
		background-color: rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--spacing-sm);
		color: var(--white);
	}

	h3 {
		font: var(--h3);
		color: var(--white);
		margin: 0;
	}

	.description {
		font: var(--paragrafo);
		color: var(--white);
		opacity: 0.9;
		margin: 0;
		white-space: pre-wrap;
		font-family: inherit;
	}

	.action-btn {
		font: var(--button);
		background-color: var(--white);
		color: #002068;
		border: none;
		border-radius: 9999px;
		padding: var(--spacing-sm) var(--spacing-lg);
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
		text-decoration: none;
		transition: var(--transition-default);
	}

	.action-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.action-btn:active {
		transform: translateY(0);
	}

	.action-btn:focus-visible {
		outline: 2px solid var(--white);
		outline-offset: 2px;
	}
</style>
