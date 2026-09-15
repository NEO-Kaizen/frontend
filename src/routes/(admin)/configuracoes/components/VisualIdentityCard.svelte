<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { getSettingsState } from '$lib/states/settings.svelte';
	import { endPreviewTheme, getThemeMode, previewThemeMode } from '$lib/states/theme.svelte';
	import {
		STATUS_TONES,
		THEME_TOKEN_KEYS,
		type StatusTone,
		type ThemePalette,
		type ThemeTokenKey
	} from '$lib/types/portal-config';
	import {
		classifyContrast,
		contrastRatio,
		flattenColor,
		meetsMinimum,
		MIN_AA_NORMAL,
		MIN_NON_TEXT,
		type ContrastLevel
	} from '$lib/utils/contrast';
	import ColorField from './ColorField.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const settingsState = getSettingsState();

	// Paleta em edição. O toggle aplica a paleta no documento **temporariamente**
	// (sem persistir), de modo que a página inteira renderize no contexto da
	// paleta configurada — evita editar a paleta clara num app escuro. Ao sair,
	// o tema real do usuário é restaurado. Entra seguindo o tema atual.
	let editingPalette = $state<ThemePalette>('light');

	onMount(() => {
		editingPalette = getThemeMode();
	});

	$effect(() => {
		previewThemeMode(editingPalette);
		return () => endPreviewTheme();
	});

	const palette = $derived(settingsState.draft.theme[editingPalette]);
	const surface = $derived(palette.surface);
	const pageBackground = $derived(palette.background);

	const TOKEN_LABELS: Record<ThemeTokenKey, string> = {
		background: 'Fundo da página',
		surface: 'Superfície',
		border: 'Borda',
		textPrimary: 'Texto principal',
		textSecondary: 'Texto secundário',
		richBlack: 'Rich black',
		primary: 'Cor primária',
		secondary: 'Cor secundária',
		tint: 'Tint'
	};

	const TONE_LABELS: Record<StatusTone, string> = {
		error: 'Erro',
		success: 'Sucesso',
		info: 'Informação',
		warning: 'Alerta'
	};

	const LEVEL_LABELS: Record<ContrastLevel, string> = {
		AAA: 'AAA',
		AA: 'AA',
		'AA-large': 'AA (texto grande)',
		fail: 'insuficiente'
	};

	// Advisor por tom (modelo monocromático): acento × fundo do badge (AA 4,5:1,
	// legibilidade do rótulo) e acento × fundo da página (3:1, visibilidade do
	// ponto/borda). Apenas avisa — nunca bloqueia o salvamento.
	const toneAdvisories = $derived(
		STATUS_TONES.map((tone) => {
			const tokens = palette.statuses[tone];
			const backgroundRatio = contrastRatio(tokens.color, tokens.background, surface);
			const pageRatio = contrastRatio(tokens.color, pageBackground, pageBackground);
			return {
				tone,
				tokens,
				// Fundo achatado para o preview não depender do tema ativo do app.
				previewBackground: flattenColor(tokens.background, surface),
				backgroundRatio,
				pageRatio,
				backgroundPass: meetsMinimum(backgroundRatio, MIN_AA_NORMAL),
				pagePass: meetsMinimum(pageRatio, MIN_NON_TEXT)
			};
		})
	);

	function setEditingPalette(next: ThemePalette) {
		editingPalette = next;
	}
</script>

<SettingsCard
	iconName="palette"
	title="3. Identidade visual: tokens de cor"
	description="Configure as cores de cada tema e os tons de status. O usuário escolhe qual tema usar."
>
	{#snippet headerAction()}
		<div class="palette-switch" role="group" aria-label="Paleta em edição">
			<button
				class="palette-option"
				class:active={editingPalette === 'light'}
				type="button"
				aria-pressed={editingPalette === 'light'}
				onclick={() => setEditingPalette('light')}
			>
				<Icon iconName="lightMode" iconSize="sm" />
				Claro
			</button>
			<button
				class="palette-option"
				class:active={editingPalette === 'dark'}
				type="button"
				aria-pressed={editingPalette === 'dark'}
				onclick={() => setEditingPalette('dark')}
			>
				<Icon iconName="darkMode" iconSize="sm" />
				Escuro
			</button>
		</div>
	{/snippet}

	<section class="section">
		<h3 class="section-title">Tokens do tema</h3>
		<div class="token-grid">
			{#each THEME_TOKEN_KEYS as key (key)}
				<ColorField
					label={TOKEN_LABELS[key]}
					value={palette[key]}
					onchange={(value) => settingsState.setThemeToken(editingPalette, key, value)}
				/>
			{/each}
		</div>
	</section>

	<section class="section">
		<h3 class="section-title">Cores de status</h3>

		<div class="tone-list">
			{#each toneAdvisories as advisory (advisory.tone)}
				<div class="tone-editor">
					<div class="tone-editor-head">
						<span
							class="tone-badge"
							style:background-color={advisory.previewBackground}
							style:color={advisory.tokens.color}
							style:border-color={`color-mix(in srgb, ${advisory.tokens.color} 30%, transparent)`}
						>
							<span
								class="tone-dot"
								style:background-color={advisory.tokens.color}
								aria-hidden="true"
							></span>
							{TONE_LABELS[advisory.tone]}
						</span>

						<ul class="tone-advice">
							<li class:fail={!advisory.backgroundPass}>
								Acento × fundo do badge: <strong>{advisory.backgroundRatio.toFixed(2)}:1</strong>
								({LEVEL_LABELS[classifyContrast(advisory.backgroundRatio)]}) · mín. {MIN_AA_NORMAL}
							</li>
							<li class:fail={!advisory.pagePass}>
								Acento × fundo da página: <strong>{advisory.pageRatio.toFixed(2)}:1</strong>
								({LEVEL_LABELS[classifyContrast(advisory.pageRatio)]}) · mín. {MIN_NON_TEXT}
							</li>
						</ul>
					</div>

					<div class="tone-fields">
						<ColorField
							label="Acento"
							value={advisory.tokens.color}
							onchange={(value) =>
								settingsState.updateStatusToneColor(editingPalette, advisory.tone, value)}
						/>
						<ColorField
							label="Fundo"
							value={advisory.tokens.background}
							allowAlpha
							onchange={(value) =>
								settingsState.setStatusToneBackground(editingPalette, advisory.tone, value)}
						/>
					</div>

					<button
						class="tone-lock"
						class:locked={advisory.tokens.backgroundLocked}
						type="button"
						aria-pressed={advisory.tokens.backgroundLocked}
						aria-label={`${
							advisory.tokens.backgroundLocked
								? 'Destravar o fundo (voltar ao automático)'
								: 'Travar o fundo (modo manual)'
						} do tom ${TONE_LABELS[advisory.tone]}. O fundo está ${
							advisory.tokens.backgroundLocked
								? 'travado: mudar o acento não altera o fundo'
								: 'automático: o fundo acompanha o acento'
						}.`}
						title={advisory.tokens.backgroundLocked
							? 'Fundo travado: mudar o acento não altera o fundo. Clique para destravar e recalcular a sugestão a partir do acento.'
							: 'Fundo automático: acompanha o acento. Clique para travar e fixar o valor manual.'}
						onclick={() =>
							settingsState.setStatusToneBackgroundLocked(
								editingPalette,
								advisory.tone,
								!advisory.tokens.backgroundLocked
							)}
					>
						<Icon iconName={advisory.tokens.backgroundLocked ? 'lock' : 'lockOpen'} iconSize="sm" />
						{advisory.tokens.backgroundLocked ? 'Fundo travado' : 'Fundo automático'}
					</button>
				</div>
			{/each}
		</div>
	</section>
</SettingsCard>

<style>
	.palette-switch {
		display: inline-flex;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.palette-option {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		background-color: var(--white);
		color: var(--text-color-secondary);
		font: var(--label);
		font-size: 13px;
		cursor: pointer;
	}

	.palette-option + .palette-option {
		border-left: var(--border-default);
	}

	.palette-option.active {
		background-color: var(--primary-color);
		color: var(--on-primary);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.section-title {
		font: var(--label);
		font-size: 13px;
		color: var(--text-color-secondary);
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}

	.token-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: var(--spacing-md);
	}

	.tone-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.tone-editor {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
	}

	.tone-editor-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		flex-wrap: wrap;
	}

	.tone-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 2px var(--spacing-sm);
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		font: var(--label);
		font-size: 12px;
		white-space: nowrap;
	}

	.tone-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.tone-advice {
		display: flex;
		flex-direction: column;
		gap: 2px;
		list-style: none;
		text-align: right;
	}

	.tone-advice li {
		font-size: 12px;
		color: var(--text-color-secondary);
	}

	.tone-advice li.fail {
		color: var(--status-warning);
	}

	.tone-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
		max-width: 420px;
	}

	.tone-lock {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		align-self: flex-start;
		padding: 4px var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--text-color-secondary);
		font: var(--label);
		font-size: 12px;
		cursor: pointer;
	}

	.tone-lock.locked {
		border-color: var(--primary-color);
		color: var(--primary-color);
	}

	@media (max-width: 640px) {
		.tone-fields {
			grid-template-columns: 1fr;
		}
	}
</style>
