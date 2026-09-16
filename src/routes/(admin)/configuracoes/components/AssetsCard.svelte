<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { saveAssets } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import {
		ASSET_KEYS,
		type AssetKey,
		type AssetsSection,
		type PortalAssetsPatch
	} from '$lib/types/portal-config';
	import { ASSET_FILE_RULES } from '$lib/utils/validations';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	// Configuração de apresentação de cada asset — dirige a renderização sem
	// duplicar o bloco para cada chave. `previewClass` casa com o CSS abaixo.
	interface AssetUi {
		key: AssetKey;
		label: string;
		alt: string;
		previewClass: string;
	}

	const ASSET_UI: AssetUi[] = [
		{
			key: 'logoUrl',
			label: 'Logo do header',
			alt: 'Prévia do logo do header',
			previewClass: 'asset-preview-logo'
		},
		{
			key: 'avatarUrl',
			label: 'Avatar padrão',
			alt: 'Prévia do avatar padrão',
			previewClass: 'asset-preview-avatar'
		},
		{
			key: 'faviconUrl',
			label: 'Favicon',
			alt: 'Prévia do favicon',
			previewClass: 'asset-preview-favicon'
		},
		{
			key: 'loginImageUrl',
			label: 'Imagem de login',
			alt: 'Prévia da imagem de login',
			previewClass: 'asset-preview-login'
		}
	];

	// Arquivos escolhidos e não salvos (vão como partes do multipart no Salvar)
	// e os object URLs locais usados no preview até o commit.
	let pendingFiles = $state<Partial<Record<AssetKey, File>>>({});
	let previewUrls = $state<Partial<Record<AssetKey, string>>>({});

	const section = new SectionState<AssetsSection>(
		{ assets: page.data.portalConfig.assets },
		{ assets: DEFAULT_PORTAL_CONFIG.assets },
		(draft, pristine) => {
			const patch: PortalAssetsPatch = {};
			const files: Partial<Record<AssetKey, File>> = {};

			for (const key of ASSET_KEYS) {
				if (pendingFiles[key]) {
					files[key] = pendingFiles[key];
				} else if (draft.assets[key] !== pristine.assets[key]) {
					patch[key] = draft.assets[key];
				}
			}

			return saveAssets(patch, files);
		}
	);

	// Refs dos inputs de arquivo — acionados pelo botão do card.
	const fileInputs = $state<Partial<Record<AssetKey, HTMLInputElement>>>({});

	// Info de formatos/tamanho derivada das regras do contrato.
	function assetInfo(key: AssetKey): string {
		const rule = ASSET_FILE_RULES[key];
		const formats = rule.extensions.map((ext) => ext.replace('.', '').toUpperCase()).join(', ');
		const maxMb = Math.round(rule.maxBytes / (1024 * 1024));
		return `Formatos: ${formats} | Tamanho máx.: ${maxMb}MB`;
	}

	// Preview local até o Salvar: guarda o arquivo e troca a URL do draft pela
	// object URL imediata. O binário só sobe no PATCH multipart de assets.
	function handleAssetChange(event: Event, asset: AssetKey) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;

		const previous = previewUrls[asset];
		if (previous) URL.revokeObjectURL(previous);

		const url = URL.createObjectURL(file);
		pendingFiles = { ...pendingFiles, [asset]: file };
		previewUrls = { ...previewUrls, [asset]: url };
		section.draft = { assets: { ...section.draft.assets, [asset]: url } };
		section.clearFeedback();
	}

	function clearPendingFiles() {
		for (const url of Object.values(previewUrls)) {
			if (url) URL.revokeObjectURL(url);
		}
		pendingFiles = {};
		previewUrls = {};
	}

	async function handleSave() {
		if (await section.save()) {
			clearPendingFiles();
			await invalidateAll();
		}
	}

	function handleCancel() {
		section.reset();
		clearPendingFiles();
	}

	function handleRestoreDefaults() {
		section.restoreDefaults();
		clearPendingFiles();
	}

	onDestroy(clearPendingFiles);
</script>

<SettingsCard
	iconName="cloudUpload"
	title="4. Assets"
	description="Faça o upload dos assets do portal e defina o texto alternativo quando necessário."
>
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			feedback={section.feedback}
			onSave={handleSave}
			onCancel={handleCancel}
			onRestoreDefaults={handleRestoreDefaults}
		/>
	{/snippet}

	<div class="assets-body">
		{#each ASSET_UI as asset (asset.key)}
			<div class="asset-section">
				<div class="asset-section-header">
					<span class="asset-label">{asset.label}</span>
					<span class="asset-current">Novo / Atual</span>
				</div>

				<div class="asset-content">
					<img
						class="asset-preview {asset.previewClass}"
						src={section.draft.assets[asset.key]}
						alt={asset.alt}
					/>

					<div class="asset-actions">
						<Button
							variant="outline-neutral"
							disabled={section.saving}
							onclick={() => fileInputs[asset.key]?.click()}
						>
							<Icon iconName="edit" iconSize="sm" />
							Alterar imagem
						</Button>
						<p class="asset-info">{assetInfo(asset.key)}</p>
					</div>

					<img
						class="asset-preview {asset.previewClass}-current"
						src={section.pristine.assets[asset.key]}
						alt="{asset.label} atual"
					/>
				</div>
			</div>
		{/each}
	</div>

	{#each ASSET_UI as asset (asset.key)}
		<input
			class="sr-only"
			bind:this={fileInputs[asset.key]}
			type="file"
			accept={ASSET_FILE_RULES[asset.key].extensions.join(',')}
			tabindex="-1"
			aria-label={`Alterar ${asset.label}`}
			onchange={(event) => handleAssetChange(event, asset.key)}
		/>
	{/each}
</SettingsCard>

<style>
	.assets-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.asset-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background-color: var(--background-color);
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.asset-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.asset-label {
		font: var(--label);
		color: var(--rich-black);
	}

	.asset-current {
		font: var(--paragrafo);
		font-size: 12px;
		color: var(--gray);
	}

	.asset-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.asset-preview {
		flex-shrink: 0;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
	}

	.asset-preview-logo {
		width: 80px;
		height: 56px;
		object-fit: contain;
	}

	.asset-preview-logo-current {
		width: 56px;
		height: 40px;
		object-fit: contain;
	}

	.asset-preview-avatar {
		width: 56px;
		height: 56px;
		border-radius: 100%;
		object-fit: cover;
	}

	.asset-preview-avatar-current {
		width: 40px;
		height: 40px;
		border-radius: 100%;
		object-fit: cover;
	}

	.asset-preview-favicon {
		width: 40px;
		height: 40px;
		padding: 4px;
		object-fit: contain;
	}

	.asset-preview-favicon-current {
		width: 32px;
		height: 32px;
		padding: 3px;
		object-fit: contain;
	}

	.asset-preview-login {
		width: 120px;
		height: 68px;
		object-fit: cover;
	}

	.asset-preview-login-current {
		width: 80px;
		height: 45px;
		object-fit: cover;
	}

	.asset-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.asset-info {
		margin: 0;
		font: var(--paragrafo);
		font-size: 12px;
		color: var(--gray);
	}

	:global(.asset-actions button) {
		padding: 4px 12px;
		gap: 4px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		white-space: nowrap;
	}

	:global(.asset-actions button .material-symbols-outlined) {
		font-size: 14px;
	}
</style>
