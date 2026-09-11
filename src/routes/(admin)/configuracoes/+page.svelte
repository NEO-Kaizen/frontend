<script lang="ts">
	import { page } from '$app/state';
	import AccessCard from './components/AccessCard.svelte';
	import AssetsCard from './components/AssetsCard.svelte';
	import CategoriesCard from './components/CategoriesCard.svelte';
	import PlatformIdentityCard from './components/PlatformIdentityCard.svelte';
	import SettingsActions from './components/SettingsActions.svelte';
	import SettingsPageHeader from './components/SettingsPageHeader.svelte';
	import StatusCard from './components/StatusCard.svelte';
	import VisualIdentityCard from './components/VisualIdentityCard.svelte';
</script>

<svelte:head>
	<title>Configurações - {page.data.portalConfig.platformName}</title>
</svelte:head>

<main class="content-container settings-page">
	<SettingsPageHeader />

	<div class="settings-grid">
		<AccessCard />
		<PlatformIdentityCard />
		<VisualIdentityCard />
		<AssetsCard />
		<CategoriesCard />
		<StatusCard />
	</div>

	<SettingsActions />
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
	}

	@media (max-width: 900px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
