<script lang="ts">
	import avatarUrl from '$lib/assets/avatar-default.svg';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SettingsCard from './SettingsCard.svelte';
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
				<div class="logo-box" aria-hidden="true">
					<span>NEO</span>
				</div>

				<div class="asset-actions">
					<Button variant="outline-neutral">
						<Icon iconName="edit" iconSize="sm" />
						Alterar imagem
					</Button>
					<p class="asset-info">Formatos: PNG, SVG | Tamanho máx.: 2MB</p>
				</div>

				<div class="logo-box logo-box-current" aria-hidden="true">
					<span>NEO</span>
				</div>
			</div>
		</div>

		<div class="asset-section">
			<div class="asset-section-header">
				<span class="asset-label">Avatar padrão</span>
				<span class="asset-current">Atual</span>
			</div>

			<div class="asset-content">
				<img class="avatar-img" src={avatarUrl} alt="" />

				<div class="asset-actions">
					<Button variant="outline-neutral">
						<Icon iconName="edit" iconSize="sm" />
						Alterar imagem
					</Button>
					<p class="asset-info">Formatos: JPG, PNG | Tamanho máx.: 2MB</p>
				</div>

				<img class="avatar-current" src={avatarUrl} alt="" />
			</div>
		</div>
	</div>
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
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
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

	.logo-box {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.logo-box {
		width: 72px;
		height: 48px;
		font: var(--label);
		font-size: 16px;
		color: var(--primary-color);
	}

	.logo-box-current {
		font-size: 12px;
	}

	.avatar-img {
		width: 48px;
		height: 48px;
		border-radius: 100%;
		object-fit: cover;
	}

	.avatar-current {
		width: 32px;
		height: 32px;
		border-radius: 100%;
		border: var(--border-default);
		background-color: var(--white);
		object-fit: cover;
		flex-shrink: 0;
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
