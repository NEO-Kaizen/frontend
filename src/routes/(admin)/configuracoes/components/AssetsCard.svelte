<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { getSettingsState } from '$lib/states/settings.svelte';
	import type { AssetKey } from '$lib/types/portal-config';
	import { ASSET_FILE_RULES } from '$lib/utils/validations';
	import SettingsCard from './SettingsCard.svelte';

	const settingsState = getSettingsState();

	let logoInput: HTMLInputElement;
	let avatarInput: HTMLInputElement;

	let assetErrors = $state<Partial<Record<AssetKey, string>>>({});

	async function handleAssetChange(event: Event, asset: AssetKey) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			const result = await settingsState.changeAsset(asset, file);
			assetErrors = { ...assetErrors, [asset]: result.ok ? '' : result.error.message };
		}
		input.value = '';
	}
</script>

<SettingsCard
	iconName="cloudUpload"
	title="4. Assets"
	description="Faça o upload dos assets do portal e defina o texto alternativo quando necessário."
>
	<div class="assets-body">
		<div class="asset-section">
			<div class="asset-section-header">
				<span class="asset-label">Logo do header</span>
				<span class="asset-current">Atual</span>
			</div>

			<div class="asset-content">
				<img
					class="asset-preview asset-preview-logo"
					src={settingsState.draft.assets.logoUrl}
					alt="Prévia do logo do header"
				/>

				<div class="asset-actions">
					<Button
						variant="outline-neutral"
						loading={settingsState.uploadingAsset === 'logoUrl'}
						disabled={settingsState.saving}
						onclick={() => logoInput.click()}
					>
						<Icon iconName="edit" iconSize="sm" />
						Alterar imagem
					</Button>
					<p class="asset-info">Formatos: PNG, SVG | Tamanho máx.: 2MB</p>
					{#if assetErrors.logoUrl}
						<p class="asset-error" role="alert">
							{assetErrors.logoUrl}
						</p>
					{/if}
				</div>

				<img
					class="asset-preview asset-preview-current"
					src={settingsState.pristine.assets.logoUrl}
					alt="Logo do header atual"
				/>
			</div>
		</div>

		<div class="asset-section">
			<div class="asset-section-header">
				<span class="asset-label">Avatar padrão</span>
				<span class="asset-current">Atual</span>
			</div>

			<div class="asset-content">
				<img
					class="asset-preview asset-preview-avatar"
					src={settingsState.draft.assets.avatarUrl}
					alt="Prévia do avatar padrão"
				/>

				<div class="asset-actions">
					<Button
						variant="outline-neutral"
						loading={settingsState.uploadingAsset === 'avatarUrl'}
						disabled={settingsState.saving}
						onclick={() => avatarInput.click()}
					>
						<Icon iconName="edit" iconSize="sm" />
						Alterar imagem
					</Button>
					<p class="asset-info">Formatos: JPG, PNG | Tamanho máx.: 2MB</p>
					{#if assetErrors.avatarUrl}
						<p class="asset-error" role="alert">
							{assetErrors.avatarUrl}
						</p>
					{/if}
				</div>

				<img
					class="asset-preview asset-preview-avatar-current"
					src={settingsState.pristine.assets.avatarUrl}
					alt="Avatar padrão atual"
				/>
			</div>
		</div>
	</div>

	<input
		class="sr-only"
		bind:this={logoInput}
		type="file"
		accept={ASSET_FILE_RULES.logoUrl.extensions.join(',')}
		tabindex="-1"
		aria-label="Alterar logo do header"
		onchange={(event) => handleAssetChange(event, 'logoUrl')}
	/>

	<input
		class="sr-only"
		bind:this={avatarInput}
		type="file"
		accept={ASSET_FILE_RULES.avatarUrl.extensions.join(',')}
		tabindex="-1"
		aria-label="Alterar avatar padrão"
		onchange={(event) => handleAssetChange(event, 'avatarUrl')}
	/>
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

	.asset-preview-avatar,
	.asset-preview-avatar-current {
		border-radius: 100%;
		object-fit: cover;
	}

	.asset-preview-avatar {
		width: 56px;
		height: 56px;
	}

	.asset-preview-current {
		width: 56px;
		height: 40px;
		object-fit: contain;
	}

	.asset-preview-avatar-current {
		width: 40px;
		height: 40px;
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

	.asset-error {
		margin: 0;
		color: var(--status-red);
		font: var(--label);
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
