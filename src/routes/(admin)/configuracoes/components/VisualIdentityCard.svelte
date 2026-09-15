<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SettingsCard from './SettingsCard.svelte';

	interface ColorToken {
		name: string;
		variable: string;
		lightHex: string;
		darkHex: string;
		light?: boolean;
	}

	const colorTokens: ColorToken[] = [
		{ name: 'Cor primária', variable: '--primary-color', lightHex: '#00236F', darkHex: '#000000' },
		{
			name: 'Cor secundária',
			variable: '--secondary-color',
			lightHex: '#0058BE',
			darkHex: '#000000'
		},
		{
			name: 'Cor de fundo',
			variable: '--background-color',
			lightHex: '#F0F4F8',
			darkHex: '#000000',
			light: true
		},
		{
			name: 'Cor de texto principal',
			variable: '--text-color-primary',
			lightHex: '#3C3E47',
			darkHex: '#000000'
		},
		{
			name: 'Cor de texto secundário',
			variable: '--text-color-secondary',
			lightHex: '#757682',
			darkHex: '#000000'
		},
		{ name: 'Cor de erro', variable: '--status-error', lightHex: '#EF4444', darkHex: '#000000' },
		{
			name: 'Cor de sucesso',
			variable: '--status-success',
			lightHex: '#10B981',
			darkHex: '#000000'
		},
		{
			name: 'Cor de informação',
			variable: '--status-info',
			lightHex: '#0058BE',
			darkHex: '#000000'
		},
		{ name: 'Cor de alerta', variable: '--status-warning', lightHex: '#956006', darkHex: '#000000' }
	];
</script>

<SettingsCard
	iconName="palette"
	title="3. Identidade visual: tokens de cor"
	description="Personalize as cores do portal. Os tokens são aplicados diretamente no documento."
>
	<div class="card-content">
		<table class="token-table">
			<thead>
				<tr>
					<th scope="col" class="col-token"></th>
					<th scope="col" class="col-theme">
						<Button variant="secondary" class="theme-button">
							<Icon iconName="lightMode" iconSize="sm" />
							Claro
						</Button>
					</th>
					<th scope="col" class="col-theme col-theme-dark">
						<Button variant="outline-neutral" class="theme-button theme-button-dark">
							<Icon iconName="darkMode" iconSize="sm" />
							Escuro
						</Button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each colorTokens as token (token.variable)}
					<tr>
						<th scope="row">
							<span
								class="token-dot"
								class:light={token.light}
								style:background-color={token.lightHex}
								aria-hidden="true"
							></span>
							<span class="token-text">
								<span class="token-name">{token.name}</span>
								<span class="token-variable">{token.variable}</span>
							</span>
						</th>
						<td class="theme-cell">
							<span class="token-hex" class:light={token.light}>
								<span
									class="token-swatch"
									class:light={token.light}
									style:background-color={token.lightHex}
									aria-hidden="true"
								></span>
								{token.lightHex}
							</span>
						</td>
						<td class="theme-cell">
							<span class="token-hex">
								<span class="token-swatch" style:background-color={token.darkHex} aria-hidden="true"
								></span>
								{token.darkHex}
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</SettingsCard>

<style>
	.card-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.token-table {
		width: 100%;
		border-collapse: collapse;
	}

	.token-table th,
	.token-table td {
		text-align: left;
		vertical-align: middle;
		border-bottom: var(--border-default);
		padding: var(--spacing-sm) 0;
	}

	.token-table tbody tr:last-child th,
	.token-table tbody tr:last-child td {
		border-bottom: none;
	}

	.col-token {
		width: auto;
	}

	.col-theme {
		width: 140px;
		text-align: center;
	}

	.token-table th.col-theme-dark {
		padding-left: 20px;
	}

	:global(.theme-button) {
		width: 100px;
		height: 28px;
		padding: 0;
	}

	:global(.theme-button-dark) {
		border-color: var(--rich-black);
		color: var(--rich-black);
	}

	.theme-cell {
		text-align: center;
	}

	.token-table thead th {
		font: var(--label);
		font-size: 13px;
		color: var(--gray);
		padding-bottom: var(--spacing-sm);
	}

	.token-dot {
		display: inline-flex;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.token-dot.light {
		border: 1px solid var(--gray);
	}

	.token-text {
		display: inline-flex;
		vertical-align: middle;
		flex-direction: column;
		gap: 2px;
		margin-left: var(--spacing-sm);
	}

	.token-name {
		font: var(--label);
		color: var(--rich-black);
	}

	.token-variable {
		font-size: 12px;
		line-height: 1.5;
		color: var(--gray);
	}

	.token-hex {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		height: 30px;
		padding: 0 var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		font: var(--label);
		font-size: 13px;
		color: var(--rich-black);
	}

	.token-swatch {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.token-swatch.light {
		border: 1px solid var(--gray);
	}
</style>
