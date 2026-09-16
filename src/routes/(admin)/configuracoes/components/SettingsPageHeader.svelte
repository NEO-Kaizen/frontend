<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
</script>

<div class="settings-page-header">
	<span class="icon-square" aria-hidden="true">
		<Icon iconName="settings" iconSize="md" />
	</span>
	<div class="text">
		<h1>Configurações Administrativas</h1>
		<p>Gerencie os parâmetros que definem o comportamento e a identidade do portal.</p>
	</div>
</div>

<style>
	.settings-page-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.icon-square {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-sm);
		background-color: var(--tint);
		color: var(--secondary-color);
		flex-shrink: 0;
	}

	.text {
		display: flex;
		flex-direction: column;
	}

	.text h1 {
		margin: 0;
		font: var(--h1);
		color: var(--primary-color);
	}

	.text p {
		margin: 0;
		font: var(--paragrafo);
		color: var(--gray);
	}
</style>
