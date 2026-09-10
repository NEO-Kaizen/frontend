<script lang="ts">
	import SettingsCard from './SettingsCard.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import avatarUrl from '$lib/assets/avatar-default.svg';
</script>

<SettingsCard
	iconName="cloudUpload"
	title="4. Assets"
	description="Faça o upload dos assets do portal e defina o texto alternativo quando necessário."
>
	<div class="asset-section">
		<div class="asset-section-header">
			<span class="asset-label">Logo do header</span>
			<span class="asset-current">Atual</span>
		</div>

		<div class="asset-preview">
			<span class="asset-identity logo-wordmark-main">NEO</span>
			<Button variant="outline">
				<Icon iconName="edit" iconSize="sm" />
				Alterar imagem
			</Button>
			<span class="logo-wordmark-mini" aria-hidden="true">NEO</span>
		</div>

		<p class="asset-info">Formatos: PNG, SVG | Tamanho máx.: 2MB</p>
	</div>

	<div class="asset-section">
		<div class="asset-section-header">
			<span class="asset-label">Avatar padrão</span>
			<span class="asset-current">Atual</span>
		</div>

		<div class="asset-preview">
			<img class="avatar-main" src={avatarUrl} alt="Avatar padrão" />
			<Button variant="outline">
				<Icon iconName="edit" iconSize="sm" />
				Alterar imagem
			</Button>
			<img class="avatar-mini" src={avatarUrl} alt="" />
		</div>

		<p class="asset-info">Formatos: JPG, PNG | Tamanho máx.: 2MB</p>
	</div>
</SettingsCard>

<style>
	.asset-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.asset-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.asset-label {
		font: var(--label);
		color: var(--black);
	}

	.asset-current {
		font: var(--paragrafo);
		font-size: 13px;
		color: var(--gray);
	}

	.asset-preview {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background-color: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.asset-identity {
		flex: 1;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.logo-wordmark-main,
	.logo-wordmark-mini {
		font: var(--h3);
		color: var(--primary-color);
	}

	.logo-wordmark-main {
		font-size: 24px;
		line-height: 1;
	}

	.logo-wordmark-mini {
		font-size: 14px;
		line-height: 1;
		opacity: 0.7;
		flex-shrink: 0;
	}

	.avatar-main,
	.avatar-mini {
		border-radius: 100%;
		object-fit: cover;
	}

	.avatar-main {
		width: 40px;
		height: 40px;
		flex: 0 0 auto;
		margin-right: auto;
	}

	.avatar-mini {
		width: 28px;
		height: 28px;
		flex-shrink: 0;
	}

	.asset-info {
		margin: 0;
		font: var(--paragrafo);
		font-size: 13px;
		color: var(--gray);
	}
</style>
