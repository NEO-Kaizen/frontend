<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		iconName?: IconName;
		headerAction?: Snippet;
		children?: Snippet;
		// Ações do card (Salvar/Cancelar/feedback) — cada seção é independente.
		actions?: Snippet;
	}

	let { title, description = '', iconName, headerAction, children, actions }: Props = $props();
</script>

<article class="settings-card">
	<header class="settings-card-header">
		{#if iconName}
			<span class="icon-square" aria-hidden="true">
				<Icon {iconName} iconSize="md" />
			</span>
		{/if}
		<div class="settings-card-text">
			<h2>{title}</h2>
			{#if description}
				<p>{description}</p>
			{/if}
		</div>

		{#if headerAction}
			<div class="settings-card-action">
				{@render headerAction()}
			</div>
		{/if}
	</header>

	{#if children}
		{@render children()}
	{/if}

	{#if actions}
		<footer class="settings-card-actions">
			{@render actions()}
		</footer>
	{/if}
</article>

<style>
	.settings-card {
		width: 100%;
		box-sizing: border-box;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		box-shadow: var(--regular-shadow);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.settings-card-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.icon-square {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		background-color: var(--tint);
		color: var(--secondary-color);
		flex-shrink: 0;
	}

	.settings-card-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.settings-card-action {
		margin-left: auto;
		display: flex;
		align-items: flex-start;
		flex-shrink: 0;
	}

	.settings-card-actions {
		border-top: var(--border-default);
		padding-top: var(--spacing-md);
	}

	h2 {
		margin: 0;
		font: var(--h4);
		color: var(--text-color-primary);
	}

	p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--gray);
	}
</style>
