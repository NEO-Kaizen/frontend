<script lang="ts">
	import { dev } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { has } from '$lib/services/access.service';
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
	const canManage = $derived(has('portal_setting:manage', data.user));

	// Botão de exemplo carregado só em dev; o preset e o handler ficam em chunks
	// separados, fora do bundle principal de produção. O Rollup pode emitir esse
	// chunk em prod, mas ele não é carregado porque `dev` é false.
	type NeoExampleButtonComponent =
		(typeof import('./components/NeoExampleButton.svelte'))['default'];
	let NeoExampleButton = $state<NeoExampleButtonComponent | null>(null);

	onMount(async () => {
		if (!dev || !canManage) return;
		NeoExampleButton = (await import('./components/NeoExampleButton.svelte')).default;
	});
</script>

<svelte:head>
	<title
		>Configurações - {data.portalConfig?.platformName ?? DEFAULT_PORTAL_CONFIG.platformName}</title
	>
</svelte:head>

<main class="content-container settings-page">
	<div class="settings-header-row">
		<SettingsPageHeader />

		{#if dev && canManage && NeoExampleButton}
			<NeoExampleButton disabled={loadFailed} />
		{/if}
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
			</div>
			<div class="settings-col">
				<PlatformIdentityCard />
				<AssetsCard />
				<CategoriesCard />
				<PriorizationWeightsCard />
			</div>
			<div class="status-full">
				<StatusCard />
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

	.status-full {
		grid-column: 1 / -1;
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

		.settings-col:nth-child(2) > :global(*:nth-child(1)) {
			order: 2;
		}

		.settings-col:nth-child(2) > :global(*:nth-child(2)) {
			order: 4;
		}

		.settings-col:nth-child(2) > :global(*:nth-child(3)) {
			order: 5;
		}

		.settings-col:nth-child(2) > :global(*:nth-child(4)) {
			order: 6;
		}

		.status-full {
			order: 7;
		}
	}
</style>
