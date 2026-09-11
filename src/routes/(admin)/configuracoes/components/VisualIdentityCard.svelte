<script lang="ts">
	import SettingsCard from './SettingsCard.svelte';

	interface ColorToken {
		name: string;
		token: string;
		value: string;
		color: string;
		light?: boolean;
	}

	const colorTokens: ColorToken[] = [
		{ name: 'Cor primária', token: '--color-primary', value: '#00236f', color: '#00236f' },
		{ name: 'Cor secundária', token: '--color-secondary', value: '#0056be', color: '#0056be' },
		{
			name: 'Cor de fundo',
			token: '--background-color',
			value: '#f0f1f3',
			color: '#f0f1f3',
			light: true
		},
		{ name: 'Cor de texto 1', token: '--text-color-primary', value: '#0f1a2a', color: '#0f1a2a' },
		{ name: 'Cor de texto 2', token: '--text-color-secondary', value: '#757682', color: '#757682' }
	];
</script>

<SettingsCard
	iconName="palette"
	title="3. Identidade visual: tokens de cor"
	description="Personalize as cores do portal. Os tokens são aplicados diretamente no documento."
>
	<div class="token-list">
		{#each colorTokens as token (token.token)}
			<div class="token-row">
				<span
					class="token-dot"
					class:light={token.light}
					style:background-color={token.color}
					aria-hidden="true"
				></span>
				<span class="token-text">
					<span class="token-name">{token.name}</span>
					<span class="token-technical">{token.token}</span>
				</span>
				<span class="token-value">
					<span class="token-hex">{token.value}</span>
					<span
						class="token-preview"
						class:light={token.light}
						style:background-color={token.color}
						aria-hidden="true"
					></span>
				</span>
			</div>
		{/each}
	</div>
</SettingsCard>

<style>
	.token-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.token-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.token-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.token-dot.light {
		border: 1px solid var(--gray);
	}

	.token-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		flex: 1;
	}

	.token-name {
		font: var(--label);
		color: var(--rich-black);
	}

	.token-technical {
		font-size: 12px;
		line-height: 1.5;
		color: var(--gray);
	}

	.token-value {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.token-hex {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 90px;
		height: 30px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		font: var(--label);
		font-size: 13px;
		color: var(--rich-black);
		flex-shrink: 0;
	}

	.token-preview {
		width: 90px;
		height: 30px;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.token-preview.light {
		border: var(--border-default);
	}
</style>
