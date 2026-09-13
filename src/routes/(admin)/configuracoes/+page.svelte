<script lang="ts">
	import { page } from '$app/state';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { settingsState } from '$lib/config/settings.svelte';
	import AccessCard from './components/AccessCard.svelte';
	import AssetsCard from './components/AssetsCard.svelte';
	import CategoriesCard from './components/CategoriesCard.svelte';
	import PlatformIdentityCard from './components/PlatformIdentityCard.svelte';
	import SettingsActions from './components/SettingsActions.svelte';
	import SettingsPageHeader from './components/SettingsPageHeader.svelte';
	import StatusCard from './components/StatusCard.svelte';
	import VisualIdentityCard from './components/VisualIdentityCard.svelte';

	let confirmRestore = $state(false);

	$effect(() => {
		const config = page.data.portalConfig;
		settingsState.init(config);
	});
</script>

<svelte:head>
	<title>Configurações - {page.data.portalConfig.platformName}</title>
</svelte:head>

<main class="content-container settings-page">
	<SettingsPageHeader />

	<div class="settings-grid">
		<AccessCard
			mode={settingsState.draft.solicitationMode}
			onchange={(mode) => settingsState.setSolicitationMode(mode)}
		/>
		<PlatformIdentityCard
			platformName={settingsState.draft.platformName}
			protocolMask={settingsState.draft.protocolMask}
			saving={settingsState.saving}
			errors={settingsState.fieldErrors}
			onchange={(field, value) => {
				if (field === 'platformName') {
					settingsState.setPlatformName(value);
				} else {
					settingsState.setProtocolMask(value);
				}
			}}
		/>
		<VisualIdentityCard />
		<AssetsCard />
		<CategoriesCard />
		<StatusCard />
	</div>

	<SettingsActions
		dirty={settingsState.dirty}
		saving={settingsState.saving}
		invalid={settingsState.hasValidationErrors}
		feedback={settingsState.feedback}
		feedbackType={settingsState.feedbackType}
		onSave={() => settingsState.save()}
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
	}

	@media (max-width: 900px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
