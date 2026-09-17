<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import AssetImage from '$lib/components/AssetImage.svelte';
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
	import { notifySectionSave } from '$lib/utils/feedback';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	// Cada asset tem duas variantes (tema claro/escuro); o logo também expõe o
	// toggle de cor primária. `previewClass` casa com o CSS abaixo.
	interface AssetVariantUi {
		key: AssetKey;
		theme: 'light' | 'dark';
		label: string;
	}

	interface AssetUi {
		id: string;
		label: string;
		alt: string;
		previewClass: string;
		variants: AssetVariantUi[];
		// Só o logo tem o flag de renderização monocromática na cor primária.
		primaryFlag?: boolean;
	}

	const ASSET_UI: AssetUi[] = [
		{
			id: 'logo',
			label: 'Logo do header',
			alt: 'Prévia do logo do header',
			previewClass: 'asset-preview-logo',
			primaryFlag: true,
			variants: [
				{ key: 'logoLightUrl', theme: 'light', label: 'Claro' },
				{ key: 'logoDarkUrl', theme: 'dark', label: 'Escuro' }
			]
		},
		{
			id: 'avatar',
			label: 'Avatar padrão',
			alt: 'Prévia do avatar padrão',
			previewClass: 'asset-preview-avatar',
			variants: [
				{ key: 'avatarLightUrl', theme: 'light', label: 'Claro' },
				{ key: 'avatarDarkUrl', theme: 'dark', label: 'Escuro' }
			]
		},
		{
			id: 'favicon',
			label: 'Favicon',
			alt: 'Prévia do favicon',
			previewClass: 'asset-preview-favicon',
			variants: [
				{ key: 'faviconLightUrl', theme: 'light', label: 'Claro' },
				{ key: 'faviconDarkUrl', theme: 'dark', label: 'Escuro' }
			]
		},
		{
			id: 'loginImage',
			label: 'Imagem de login',
			alt: 'Prévia da imagem de login',
			previewClass: 'asset-preview-login',
			variants: [
				{ key: 'loginImageLightUrl', theme: 'light', label: 'Claro' },
				{ key: 'loginImageDarkUrl', theme: 'dark', label: 'Escuro' }
			]
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

			if (draft.assets.logoUsePrimaryColor !== pristine.assets.logoUsePrimaryColor) {
				patch.logoUsePrimaryColor = draft.assets.logoUsePrimaryColor;
			}

			return saveAssets(patch, files);
		}
	);

	// Refs dos inputs de arquivo — acionados pelo botão do card.
	const fileInputs = $state<Partial<Record<AssetKey, HTMLInputElement>>>({});

	const SVG_PATTERN = /\.svg(\?.*)?$/i;

	// Detecta SVG considerando o arquivo pendente (blob URL não tem extensão).
	function isSvgKey(key: AssetKey): boolean {
		const file = pendingFiles[key];
		if (file) return file.type === 'image/svg+xml';
		return SVG_PATTERN.test(section.draft.assets[key]);
	}

	// O flag de cor primária só faz sentido quando a variante clara do logo é SVG.
	const logoSvg = $derived(isSvgKey('logoLightUrl'));

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
	}

	function setLogoUsePrimaryColor(value: boolean) {
		section.draft = { assets: { ...section.draft.assets, logoUsePrimaryColor: value } };
	}

	function clearPendingFiles() {
		for (const url of Object.values(previewUrls)) {
			if (url) URL.revokeObjectURL(url);
		}
		pendingFiles = {};
		previewUrls = {};
	}

	async function handleSave() {
		if (notifySectionSave(await section.save())) {
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
	description="Faça o upload das variantes claro/escuro de cada imagem do portal."
>
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			restorable={section.restorable}
			onSave={handleSave}
			onCancel={handleCancel}
			onRestoreDefaults={handleRestoreDefaults}
		/>
	{/snippet}

	<div class="assets-body">
		{#each ASSET_UI as asset (asset.id)}
			<div class="asset-section">
				<div class="asset-section-header">
					<span class="asset-label">{asset.label}</span>

					{#if asset.primaryFlag}
						<label class="asset-flag" class:disabled={section.saving || !logoSvg}>
							<input
								type="checkbox"
								checked={section.draft.assets.logoUsePrimaryColor}
								disabled={section.saving || !logoSvg}
								onchange={(event) => setLogoUsePrimaryColor(event.currentTarget.checked)}
							/>
							Usar cor primária
						</label>
					{/if}
				</div>

				{#each asset.variants as variant (variant.key)}
					<div class="asset-variant">
						<div class="asset-variant-header">
							<span class="asset-variant-label">{variant.label}</span>
							<span class="asset-current">Novo / Atual</span>
						</div>

						<div class="asset-content">
							<span class="asset-preview {asset.previewClass}">
								<AssetImage
									lightSrc={section.draft.assets[variant.key]}
									alt={asset.alt}
									tint={asset.primaryFlag === true && section.draft.assets.logoUsePrimaryColor}
									svg={variant.key.startsWith('logo') ? isSvgKey(variant.key) : undefined}
									width="100%"
									height="100%"
								/>
							</span>

							<div class="asset-actions">
								<Button
									variant="outline-neutral"
									disabled={section.saving}
									onclick={() => fileInputs[variant.key]?.click()}
								>
									<Icon iconName="edit" iconSize="sm" />
									Alterar imagem
								</Button>
								<p class="asset-info">{assetInfo(variant.key)}</p>
							</div>

							<span class="asset-preview {asset.previewClass}-current">
								<AssetImage
									lightSrc={section.pristine.assets[variant.key]}
									alt={`${variant.label} atual do ${asset.label}`}
									tint={asset.primaryFlag === true && section.pristine.assets.logoUsePrimaryColor}
									width="100%"
									height="100%"
								/>
							</span>
						</div>
					</div>
				{/each}

				{#if asset.primaryFlag && !logoSvg}
					<p class="asset-hint">
						A cor primária só se aplica a arquivos SVG. Envie o logo em .svg para habilitar.
					</p>
				{/if}
			</div>
		{/each}
	</div>

	{#each ASSET_UI as asset (asset.id)}
		{#each asset.variants as variant (variant.key)}
			<input
				class="sr-only"
				bind:this={fileInputs[variant.key]}
				type="file"
				accept={ASSET_FILE_RULES[variant.key].extensions.join(',')}
				tabindex="-1"
				aria-label={`Alterar ${variant.label} de ${asset.label}`}
				onchange={(event) => handleAssetChange(event, variant.key)}
			/>
		{/each}
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
		gap: var(--spacing-md);
	}

	.asset-label {
		font: var(--label);
		color: var(--rich-black);
	}

	.asset-flag {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		font: var(--label);
		font-size: 13px;
		color: var(--text-color-secondary);
		cursor: pointer;
	}

	.asset-flag.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.asset-flag input {
		accent-color: var(--primary-color);
	}

	.asset-variant {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.asset-variant-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.asset-variant-label {
		font: var(--label);
		font-size: 12px;
		color: var(--text-color-secondary);
		text-transform: uppercase;
		letter-spacing: 0.4px;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
	}

	.asset-preview-logo {
		width: 80px;
		height: 56px;
	}

	.asset-preview-logo-current {
		width: 56px;
		height: 40px;
	}

	.asset-preview-avatar {
		width: 56px;
		height: 56px;
		border-radius: 100%;
	}

	.asset-preview-avatar-current {
		width: 40px;
		height: 40px;
		border-radius: 100%;
	}

	.asset-preview-favicon {
		width: 40px;
		height: 40px;
		padding: 4px;
	}

	.asset-preview-favicon-current {
		width: 32px;
		height: 32px;
		padding: 3px;
	}

	.asset-preview-login {
		width: 120px;
		height: 68px;
	}

	.asset-preview-login-current {
		width: 80px;
		height: 45px;
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

	.asset-hint {
		margin: 0;
		font: var(--paragrafo);
		font-size: 12px;
		color: var(--status-warning);
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
