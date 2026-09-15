<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { provideSettingsState } from '$lib/states/settings.svelte';
	import AccessCard from './components/AccessCard.svelte';
	import AssetsCard from './components/AssetsCard.svelte';
	import CategoriesCard from './components/CategoriesCard.svelte';
	import PlatformIdentityCard from './components/PlatformIdentityCard.svelte';
	import PriorizationWeightsCard from './components/PriorizationWeightsCard.svelte';
	import SettingsActions from './components/SettingsActions.svelte';
	import SettingsPageHeader from './components/SettingsPageHeader.svelte';
	import StatusCard from './components/StatusCard.svelte';
	import VisualIdentityCard from './components/VisualIdentityCard.svelte';

	const settingsState = provideSettingsState(page.data.portalConfig);

	let confirmRestore = $state(false);
</script>

<svelte:head>
	<title>Configurações - {page.data.portalConfig.platformName}</title>
</svelte:head>

<main class="content-container settings-page">
	<SettingsPageHeader />

	<div class="settings-grid">
		<div class="settings-col">
			<AccessCard
				mode={settingsState.draft.solicitationMode}
				onchange={(mode) => settingsState.setField('solicitationMode', mode)}
			/>
			<VisualIdentityCard />
			<CategoriesCard />
		</div>
		<div class="settings-col">
			<PlatformIdentityCard
				platformName={settingsState.draft.platformName}
				protocolMask={settingsState.draft.protocolMask}
				saving={settingsState.saving}
				errors={settingsState.fieldErrors}
				onchange={(field, value) => settingsState.setField(field, value)}
			/>
			<AssetsCard />
			<StatusCard />
			<PriorizationWeightsCard />
		</div>
	</div>

	<SettingsActions
		dirty={settingsState.dirty}
		saving={settingsState.saving}
		invalid={settingsState.hasValidationErrors}
		feedback={settingsState.feedback}
		onSave={async () => {
			await settingsState.save();

			if (settingsState.feedback?.type === 'success') {
				// Revalida os dados do layout para o header/footer refletirem a
				// nova logo/avatar em todo o projeto. O state de configurações já
				// foi sincronizado pelo próprio save(), então não é reinicializado.
				await invalidateAll();
			}
		}}
		onCancel={() => settingsState.reset()}
		onRestoreDefaults={() => (confirmRestore = true)}
	/>

	<ConfirmDialog
		open={confirmRestore}
		title="Restaurar valores padrão?"
		description="Esta ação substitui as configurações atuais pelos valores padrão do portal."
		confirmLabel="Restaurar"
		cancelLabel="Cancelar"
		onConfirm={() => {
			settingsState.restoreDefaults();
			confirmRestore = false;
		}}
		onClose={() => (confirmRestore = false)}
	/>
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
