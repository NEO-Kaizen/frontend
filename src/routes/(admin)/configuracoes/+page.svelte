<script lang="ts">
	import { page } from '$app/state';
	import AccessCard from './components/AccessCard.svelte';
	import AssetsCard from './components/AssetsCard.svelte';
	import CategoriesCard from './components/CategoriesCard.svelte';
	import PlatformIdentityCard from './components/PlatformIdentityCard.svelte';
	import PriorizationWeightsCard from './components/PriorizationWeightsCard.svelte';
	import SettingsPageHeader from './components/SettingsPageHeader.svelte';
	import StatusCard from './components/StatusCard.svelte';
	import VisualIdentityCard from './components/VisualIdentityCard.svelte';

	// Cada card é independente: mantém o próprio draft/pristine, validação e
	// botões Salvar/Cancelar, e persiste a sua seção via PATCH próprio.
</script>

<svelte:head>
	<title>Configurações - {page.data.portalConfig.platformName}</title>
</svelte:head>

<main class="content-container settings-page">
	<SettingsPageHeader />

	<div class="settings-grid">
		<div class="settings-col">
			<AccessCard />
			<VisualIdentityCard />
			<CategoriesCard />
		</div>
		<div class="settings-col">
			<PlatformIdentityCard />
			<AssetsCard />
			<StatusCard />
			<PriorizationWeightsCard />
		</div>
	</div>
</main>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.settings-grid {
		background-color: var(--white-gray);
		padding: var(--spacing-lg);
		border-radius: var(--radius-sm);
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-lg);
		align-items: start;
	}

	.settings-col {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	@media (max-width: 900px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}

		.settings-col {
			display: contents;
		}

		.settings-col:nth-child(1) > :global(*:nth-child(1)) {
			order: 1;
		}

		.settings-col:nth-child(1) > :global(*:nth-child(2)) {
			order: 3;
		}

		.settings-col:nth-child(1) > :global(*:nth-child(3)) {
			order: 5;
		}

		.settings-col:nth-child(2) > :global(*:nth-child(1)) {
			order: 2;
		}

		.settings-col:nth-child(2) > :global(*:nth-child(2)) {
			order: 4;
		}

		.settings-col:nth-child(2) > :global(*:nth-child(3)) {
			order: 6;
		}

		.settings-col:nth-child(2) > :global(*:nth-child(4)) {
			order: 7;
		}
	}
</style>
