<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		DEFAULT_PORTAL_CONFIG,
		NEO_EXAMPLE_ASSETS,
		NEO_THEME
	} from '$lib/config/portal-defaults';
	import { saveAssets, saveIdentity, saveTheme } from '$lib/config/portal-config.service';
	import { toastState } from '$lib/states/toast.svelte';
	import AccessCard from './components/AccessCard.svelte';
	import AssetsCard from './components/AssetsCard.svelte';
	import CategoriesCard from './components/CategoriesCard.svelte';
	import PlatformIdentityCard from './components/PlatformIdentityCard.svelte';
	import PriorizationWeightsCard from './components/PriorizationWeightsCard.svelte';
	import SettingsPageHeader from './components/SettingsPageHeader.svelte';
	import StatusCard from './components/StatusCard.svelte';
	import VisualIdentityCard from './components/VisualIdentityCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Cada card é independente: mantém o próprio draft/pristine, validação e
	// botões Salvar/Cancelar, e persiste a sua seção via PATCH próprio.
	// Se a leitura autoritativa falhou, `portalConfig` é o fallback do layout
	// (defaults) e os cards bloqueiam edição/salvamento até a revalidação.
	const loadFailed = $derived(data.portalConfigLoadError !== null);

	// Aplica e salva imediatamente a configuração de exemplo (identidade NEO +
	// tema NEO + assets de exemplo). As três seções têm PATCH próprio; salvamos
	// em sequência e paramos no primeiro erro.
	let isApplying = $state(false);

	async function handleApplyExample(): Promise<void> {
		if (isApplying || loadFailed) return;

		isApplying = true;

		const identity = await saveIdentity({ platformName: 'NEO' });
		if (!identity.ok) {
			isApplying = false;
			toastState.add(identity.error.message, 'error');
			return;
		}

		const theme = await saveTheme({ theme: structuredClone(NEO_THEME) });
		if (!theme.ok) {
			isApplying = false;
			toastState.add(theme.error.message, 'error');
			return;
		}

		const assets = await saveAssets({ ...NEO_EXAMPLE_ASSETS, logoUsePrimaryColor: true }, {});
		if (!assets.ok) {
			isApplying = false;
			toastState.add(assets.error.message, 'error');
			return;
		}

		isApplying = false;
		toastState.add('Exemplo aplicado e salvo.', 'success');
		await invalidateAll();
	}
</script>

<svelte:head>
	<title
		>Configurações - {data.portalConfig?.platformName ?? DEFAULT_PORTAL_CONFIG.platformName}</title
	>
</svelte:head>

<main class="content-container settings-page">
	<div class="settings-header-row">
		<SettingsPageHeader />

		<Button
			variant="outline-neutral"
			onclick={handleApplyExample}
			loading={isApplying}
			disabled={loadFailed}
			title="Aplicar a configuração de exemplo (tema NEO)"
		>
			<Icon iconName="autorenew" iconSize="sm" />
			Exemplo
		</Button>
	</div>

	{#if loadFailed}
		<div class="load-error" role="alert">
			<p>
				<strong>Não foi possível carregar a configuração.</strong>
				A edição e o salvamento estão bloqueados para evitar sobrescrever os dados salvos.
			</p>
			<button class="retry-button" type="button" onclick={() => invalidateAll()}>
				Tentar novamente
			</button>
		</div>
	{/if}

	{#key data.portalConfig}
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
	{/key}
</main>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.settings-header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-md);
		flex-wrap: wrap;
	}

	.load-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		flex-wrap: wrap;
		padding: var(--spacing-md) var(--spacing-lg);
		border: 1px solid var(--status-error);
		border-radius: var(--radius-sm);
		background-color: var(--status-error-bg);
		color: var(--rich-black);
	}

	.load-error p {
		margin: 0;
		font-size: 14px;
	}

	.retry-button {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--status-error);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--rich-black);
		font: var(--label);
		font-size: 13px;
		cursor: pointer;
		white-space: nowrap;
	}

	.retry-button:hover {
		background-color: var(--status-error);
		color: var(--white);
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
