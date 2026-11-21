<script lang="ts">
	import type { Snippet } from 'svelte';

	// Casca visual das seções editáveis de "Meus dados": título, descrição,
	// conteúdo e rodapé de ações. Mesmo desenho do `SettingsCard` de
	// Configurações, sem o ícone nem o "headerAction".
	interface Props {
		title: string;
		description?: string;
		children: Snippet;
		actions?: Snippet;
	}

	let { title, description = '', children, actions }: Props = $props();
</script>

<article class="profile-card">
	<header class="profile-card-header">
		<h2>{title}</h2>
		{#if description}
			<p>{description}</p>
		{/if}
	</header>

	<div class="profile-card-body">
		{@render children()}
	</div>

	{#if actions}
		<footer class="profile-card-actions">
			{@render actions()}
		</footer>
	{/if}
</article>

<style>
	.profile-card {
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

	.profile-card-header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	h2 {
		margin: 0;
		font: var(--h4);
		color: var(--heading-color);
	}

	p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--gray);
	}

	.profile-card-actions {
		border-top: var(--border-default);
		padding-top: var(--spacing-md);
	}
</style>
