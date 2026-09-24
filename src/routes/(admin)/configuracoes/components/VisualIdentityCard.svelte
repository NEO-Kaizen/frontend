<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { isPortalConfigLoadBlocked } from '$lib/config/portal-config-load';
	import { saveTheme } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import {
		endPreviewTheme,
		getThemeMode,
		previewPortalTheme,
		previewThemeMode
	} from '$lib/states/theme.svelte';
	import {
		STATUS_TONES,
		type StatusTone,
		type ThemeGradient,
		type ThemePalette,
		type ThemeSection,
		type ThemeTokenKey,
		type ThemeTokens
	} from '$lib/types/portal-config';
	import {
		contrastRatio,
		flattenColor,
		meetsMinimum,
		suggestStatusBackground,
		MIN_AA_NORMAL,
		MIN_NON_TEXT
	} from '$lib/utils/contrast';
	import { notifySectionSave } from '$lib/utils/feedback';
	import ColorField from './ColorField.svelte';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<ThemeSection>(
		{ theme: page.data.portalConfig.theme },
		{ theme: DEFAULT_PORTAL_CONFIG.theme },
		(draft) => saveTheme({ theme: draft.theme })
	);

	// Paleta em edição. O toggle aplica a paleta no documento **temporariamente**
	// (sem persistir), de modo que a página inteira renderize no contexto da
	// paleta configurada — evita editar a paleta clara num app escuro. Ao sair,
	// o tema real do usuário é restaurado. Entra seguindo o tema atual.
	let editingPalette = $state<ThemePalette>('light');

	// Leitura autoritativa falhou: o draft pode ser o fallback local — bloqueia
	// edição e salvamento até a revalidação.
	const loadFailed = $derived(isPortalConfigLoadBlocked(page.data));

	onMount(() => {
		editingPalette = getThemeMode();
	});

	$effect(() => {
		previewThemeMode(editingPalette);
		return () => endPreviewTheme();
	});

	// Aplica as cores do draft na página em tempo real. O corpo lê
	// `draft.theme` (rastreado → repinta a cada edição); o cleanup restaura a
	// paleta salva, cobrindo Cancelar/Reset e a saída da rota.
	$effect(() => {
		previewPortalTheme(section.draft.theme);
		return () => previewPortalTheme(section.pristine.theme);
	});

	const palette = $derived(section.draft.theme[editingPalette]);
	const surface = $derived(palette.surface);
	const pageBackground = $derived(palette.background);

	// Validade dos campos de cor: cada ColorField reporta o seu estado e o card
	// agrega para bloquear o Salvar. A mensagem de erro permanece inline.
	let invalidColorFields = $state<Record<string, boolean>>({});
	const invalid = $derived(Object.values(invalidColorFields).some(Boolean));

	// Salvar com contraste abaixo do mínimo pede confirmação (não bloqueia).
	let confirmLowContrast = $state(false);

	function handleColorValidity(id: string, isInvalid: boolean): void {
		invalidColorFields = { ...invalidColorFields, [id]: isInvalid };
	}

	async function persistSave(): Promise<void> {
		if (loadFailed) return;
		notifySectionSave(await section.save());
	}

	async function handleSave(): Promise<void> {
		if (loadFailed) return;
		if (hasContrastWarning) {
			confirmLowContrast = true;
			return;
		}

		await persistSave();
	}

	// Mutações do tema — o draft é atômico (as duas paletas), então cada
	// alteração substitui a paleta em edição dentro do objeto.
	function setThemeTokens(paletteKey: ThemePalette, tokens: ThemeTokens): void {
		section.draft = { theme: { ...section.draft.theme, [paletteKey]: tokens } };
	}

	function setThemeToken(paletteKey: ThemePalette, key: ThemeTokenKey, value: string): void {
		setThemeTokens(paletteKey, { ...section.draft.theme[paletteKey], [key]: value });
	}

	function setStatusToneBackground(
		paletteKey: ThemePalette,
		tone: StatusTone,
		value: string
	): void {
		const tokens = section.draft.theme[paletteKey];
		setThemeTokens(paletteKey, {
			...tokens,
			statuses: {
				...tokens.statuses,
				[tone]: { ...tokens.statuses[tone], background: value, backgroundLocked: true }
			}
		});
	}

	function setStatusToneBackgroundLocked(
		paletteKey: ThemePalette,
		tone: StatusTone,
		locked: boolean
	): void {
		const current = section.draft.theme[paletteKey].statuses[tone];
		const tokens = section.draft.theme[paletteKey];
		setThemeTokens(paletteKey, {
			...tokens,
			statuses: {
				...tokens.statuses,
				[tone]: {
					...current,
					backgroundLocked: locked,
					background: locked
						? current.background
						: suggestStatusBackground(current.color, paletteKey)
				}
			}
		});
	}

	function updateStatusToneColor(paletteKey: ThemePalette, tone: StatusTone, color: string): void {
		const current = section.draft.theme[paletteKey].statuses[tone];
		const tokens = section.draft.theme[paletteKey];
		setThemeTokens(paletteKey, {
			...tokens,
			statuses: {
				...tokens.statuses,
				[tone]: {
					...current,
					color,
					background: current.backgroundLocked
						? current.background
						: suggestStatusBackground(color, paletteKey)
				}
			}
		});
	}

	function setThemeGradient(paletteKey: ThemePalette, patch: Partial<ThemeGradient>): void {
		const tokens = section.draft.theme[paletteKey];
		setThemeTokens(paletteKey, { ...tokens, gradient: { ...tokens.gradient, ...patch } });
	}

	function handleGradientAngleInput(event: Event): void {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		if (!Number.isFinite(value)) return;
		setThemeGradient(editingPalette, { angle: Math.min(360, Math.max(0, Math.round(value))) });
	}

	const TOKEN_LABELS: Record<ThemeTokenKey, string> = {
		background: 'Fundo da página',
		surface: 'Superfície',
		border: 'Borda',
		textPrimary: 'Texto principal',
		textSecondary: 'Texto secundário',
		heading: 'Títulos',
		richBlack: 'Barra escura',
		primary: 'Primária',
		secondary: 'Secundária',
		tint: 'Realce',
		onPrimary: 'Texto sobre a primária',
		onDark: 'Texto sobre a barra escura',
		onGradient: 'Texto sobre o gradiente'
	};

	// Uso de cada token, exibido como hint acessível e no tooltip do rótulo.
	const TOKEN_HINTS: Record<ThemeTokenKey, string> = {
		background: 'Fundo das páginas do portal — usado em toda a tela.',
		surface: 'Fundo de cards, painéis e modais, sobre o fundo da página.',
		border: 'Linhas, separadores e contornos de componentes.',
		textPrimary: 'Corpo de texto e rótulos de campos e botões.',
		textSecondary: 'Legendas, datas e texto auxiliar.',
		heading: 'Títulos de página e de seção.',
		richBlack: 'Barra de navegação / sidebar — o texto sobre ela usa "onDark".',
		primary: 'Botões primários, CTAs e links principais.',
		secondary: 'Botão secundário, links e ícones de destaque.',
		tint: 'Realce em hover e seleção de tabelas e listas.',
		onPrimary: 'Texto e ícones sobre elementos na cor primária.',
		onDark: 'Texto e ícones sobre a barra escura (richBlack).',
		onGradient: 'Texto sobre o gradiente do cabeçalho.'
	};

	// Agrupamento apenas de exibição — não altera a allowlist `THEME_TOKEN_KEYS`
	// nem a persistência. Cada token de texto fica junto das cores que ele usa
	// como fundo, para o advisor de contraste medir pares reais e próximos.
	// `onGradient` é editado na seção Gradiente.
	const TOKEN_GROUPS: { title: string; keys: ThemeTokenKey[] }[] = [
		{
			title: 'Superfícies e barras',
			keys: ['background', 'surface', 'richBlack', 'tint', 'onDark']
		},
		{ title: 'Textos', keys: ['textPrimary', 'textSecondary', 'heading'] },
		{ title: 'Marca', keys: ['primary', 'secondary', 'onPrimary'] },
		{ title: 'Linhas', keys: ['border'] }
	];

	// Amostra "Aa" por token de texto: fundo de referência + a própria cor de texto.
	const TOKEN_PREVIEW_PAIRS: Partial<
		Record<ThemeTokenKey, { background: ThemeTokenKey; foreground: ThemeTokenKey }>
	> = {
		onPrimary: { background: 'primary', foreground: 'onPrimary' },
		onDark: { background: 'richBlack', foreground: 'onDark' }
	};

	// Fundos reais de cada token de texto (levantados no código da #135): mesma
	// fonte para os campos e para o advisor de contraste AA exibido sob cada cor.
	// Apenas avisa — nunca bloqueia o salvamento.
	const TOKEN_ADVISOR_BACKGROUNDS: Partial<Record<ThemeTokenKey, ThemeTokenKey[]>> = {
		onPrimary: ['primary', 'secondary'],
		onDark: ['richBlack'],
		textPrimary: ['surface', 'background'],
		textSecondary: ['surface', 'background'],
		heading: ['surface', 'background']
	};

	const tokenGroups = $derived(
		TOKEN_GROUPS.map((group) => ({
			title: group.title,
			fields: group.keys.map((key) => {
				const pair = TOKEN_PREVIEW_PAIRS[key];
				return {
					key,
					label: TOKEN_LABELS[key],
					hint: TOKEN_HINTS[key],
					reserveHint: true,
					value: palette[key],
					previewBackground: pair ? palette[pair.background] : undefined,
					previewForeground: pair ? palette[pair.foreground] : undefined,
					advisors: (TOKEN_ADVISOR_BACKGROUNDS[key] ?? []).map((backgroundKey) => {
						const background = palette[backgroundKey];
						const ratio = contrastRatio(palette[key], background, background);
						return {
							backgroundLabel: TOKEN_LABELS[backgroundKey],
							ratio,
							pass: meetsMinimum(ratio, MIN_AA_NORMAL)
						};
					})
				};
			})
		}))
	);

	const TONE_LABELS: Record<StatusTone, string> = {
		error: 'Erro',
		success: 'Sucesso',
		info: 'Informação',
		warning: 'Alerta',
		neutral: 'Neutro'
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

	// Advisor do gradiente: `onGradient` precisa manter legibilidade sobre as
	// duas pontas do gradiente (a pior das duas manda). Apenas avisa.
	const gradientAdvisory = $derived.by(() => {
		const { from, to } = palette.gradient;
		const fromRatio = contrastRatio(palette.onGradient, from, from);
		const toRatio = contrastRatio(palette.onGradient, to, to);
		return {
			fromRatio,
			toRatio,
			fromPass: meetsMinimum(fromRatio, MIN_AA_NORMAL),
			toPass: meetsMinimum(toRatio, MIN_AA_NORMAL),
			worst: Math.min(fromRatio, toRatio),
			pass: meetsMinimum(Math.min(fromRatio, toRatio), MIN_AA_NORMAL)
		};
	});

	const gradientPreviewStyle = $derived(
		`linear-gradient(${palette.gradient.angle ?? 143}deg, ${palette.gradient.from}, ${palette.gradient.to})`
	);

	// Algum par abaixo do mínimo WCAG AA? Salvar pede confirmação (não bloqueia).
	const hasContrastWarning = $derived(
		toneAdvisories.some((advisory) => !advisory.backgroundPass || !advisory.pagePass) ||
			!gradientAdvisory.pass ||
			tokenGroups.some((group) =>
				group.fields.some((field) => field.advisors.some((advisory) => !advisory.pass))
			)
	);

	function setEditingPalette(next: ThemePalette) {
		editingPalette = next;
		invalidColorFields = {};
	}
</script>

<SettingsCard
	iconName="palette"
	title="3. Identidade visual: tokens de cor"
	description="Configure as cores de cada tema e os tons de status. O usuário escolhe qual tema usar."
>
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			restorable={section.restorable}
			{invalid}
			{loadFailed}
			onSave={handleSave}
			onCancel={() => section.reset()}
			onRestoreDefaults={() => section.restoreDefaults()}
		/>
	{/snippet}

	<div class="palette-toolbar">
		<div class="palette-switch" role="group" aria-label="Paleta em edição">
			<button
				class="palette-option"
				class:active={editingPalette === 'light'}
				type="button"
				aria-pressed={editingPalette === 'light'}
				disabled={loadFailed}
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
				disabled={loadFailed}
				onclick={() => setEditingPalette('dark')}
			>
				<Icon iconName="darkMode" iconSize="sm" />
				Escuro
			</button>
		</div>
	</div>

	<section class="section">
		<h3 class="section-title">Tokens do tema</h3>

		{#each tokenGroups as group (group.title)}
			<div class="token-group">
				<h4 class="token-group-title">{group.title}</h4>
				<div class="token-grid">
					{#each group.fields as field (field.key)}
						<div class="token-field">
							<ColorField
								label={field.label}
								hint={field.hint}
								tooltip={field.hint}
								reserveHint={field.reserveHint}
								value={field.value}
								previewBackground={field.previewBackground}
								previewForeground={field.previewForeground}
								fieldId={`${editingPalette}:${field.key}`}
								disabled={loadFailed}
								onvaliditychange={handleColorValidity}
								onchange={(value) => setThemeToken(editingPalette, field.key, value)}
							/>

							{#each field.advisors as advisory (advisory.backgroundLabel)}
								<p class="field-advice" class:fail={!advisory.pass}>
									<span class="field-advice-icon" aria-hidden="true">
										<Icon iconName={advisory.pass ? 'check' : 'priority'} iconSize="sm" />
									</span>
									vs {advisory.backgroundLabel}:
									<strong>{advisory.ratio.toFixed(2)}:1</strong>
									· mín. {MIN_AA_NORMAL}:1
								</p>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</section>

	<section class="section">
		<div class="section-head">
			<h3 class="section-title">Gradiente</h3>
			<InfoTip
				label="Ver informação sobre o contraste do gradiente"
				text="O texto sobre o gradiente precisa de contraste mínimo 4,5:1 (AA) nas duas pontas. É apenas um aviso — não impede salvar."
			/>
		</div>

		<div class="gradient-editor">
			<span class="gradient-preview" style:background={gradientPreviewStyle}>
				<span class="gradient-sample" style:color={palette.onGradient}>Aa</span>
			</span>

			<div class="gradient-fields">
				<ColorField
					label="De"
					value={palette.gradient.from}
					fieldId={`${editingPalette}:gradient.from`}
					disabled={loadFailed}
					onvaliditychange={handleColorValidity}
					onchange={(value) => setThemeGradient(editingPalette, { from: value })}
				/>
				<ColorField
					label="Até"
					value={palette.gradient.to}
					fieldId={`${editingPalette}:gradient.to`}
					disabled={loadFailed}
					onvaliditychange={handleColorValidity}
					onchange={(value) => setThemeGradient(editingPalette, { to: value })}
				/>
				<ColorField
					label={TOKEN_LABELS.onGradient}
					value={palette.onGradient}
					fieldId={`${editingPalette}:onGradient`}
					disabled={loadFailed}
					onvaliditychange={handleColorValidity}
					onchange={(value) => setThemeToken(editingPalette, 'onGradient', value)}
				/>
				<label class="gradient-angle">
					<span class="gradient-angle-label">Ângulo</span>
					<input
						class="gradient-angle-input"
						type="number"
						min="0"
						max="360"
						step="1"
						value={palette.gradient.angle ?? 143}
						aria-label="Ângulo do gradiente"
						disabled={loadFailed}
						oninput={handleGradientAngleInput}
					/>
				</label>
			</div>

			<ul class="tone-advice gradient-advice">
				<li class:fail={!gradientAdvisory.fromPass}>
					<span class="advice-icon" aria-hidden="true">
						<Icon iconName={gradientAdvisory.fromPass ? 'check' : 'priority'} iconSize="sm" />
					</span>
					Texto sobre o gradiente × início:
					<strong>{gradientAdvisory.fromRatio.toFixed(2)}:1</strong> · mín. {MIN_AA_NORMAL}:1
				</li>
				<li class:fail={!gradientAdvisory.toPass}>
					<span class="advice-icon" aria-hidden="true">
						<Icon iconName={gradientAdvisory.toPass ? 'check' : 'priority'} iconSize="sm" />
					</span>
					Texto sobre o gradiente × fim: <strong>{gradientAdvisory.toRatio.toFixed(2)}:1</strong> ·
					mín. {MIN_AA_NORMAL}:1
				</li>
			</ul>
			{#if !gradientAdvisory.pass}
				<p class="tone-fix">
					Ajuste o contraste entre o texto e o gradiente (clareie ou escureça o texto).
				</p>
			{/if}
		</div>
	</section>

	<section class="section">
		<div class="section-head">
			<h3 class="section-title">Cores de status</h3>
			<InfoTip
				label="Ver informação sobre o contraste das cores de status"
				text="O contraste mede a legibilidade sobre o fundo, seguindo o mínimo WCAG (AA): texto do badge exige 4,5:1 e o ponto/borda sobre a página exige 3:1. É apenas um aviso — não impede salvar."
			/>
		</div>
		<p class="section-note">
			O contraste é apenas um aviso de legibilidade; você pode salvar mesmo abaixo do mínimo.
		</p>

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
								<span class="advice-icon" aria-hidden="true">
									<Icon iconName={advisory.backgroundPass ? 'check' : 'priority'} iconSize="sm" />
								</span>
								Texto do badge × fundo: <strong>{advisory.backgroundRatio.toFixed(2)}:1</strong> ·
								mín. {MIN_AA_NORMAL}:1
							</li>
							<li class:fail={!advisory.pagePass}>
								<span class="advice-icon" aria-hidden="true">
									<Icon iconName={advisory.pagePass ? 'check' : 'priority'} iconSize="sm" />
								</span>
								Detalhe × página: <strong>{advisory.pageRatio.toFixed(2)}:1</strong> · mín. {MIN_NON_TEXT}:1
							</li>
						</ul>
					</div>

					<div class="tone-fields">
						<ColorField
							label="Detalhe"
							value={advisory.tokens.color}
							fieldId={`${editingPalette}:status.${advisory.tone}.color`}
							disabled={loadFailed}
							onvaliditychange={handleColorValidity}
							onchange={(value) => updateStatusToneColor(editingPalette, advisory.tone, value)}
						/>
						<ColorField
							label="Fundo"
							value={advisory.tokens.background}
							allowAlpha
							fieldId={`${editingPalette}:status.${advisory.tone}.background`}
							disabled={loadFailed}
							onvaliditychange={handleColorValidity}
							onchange={(value) => setStatusToneBackground(editingPalette, advisory.tone, value)}
						/>
					</div>

					{#if !advisory.backgroundPass || !advisory.pagePass}
						<p class="tone-fix">
							Ajuste o contraste entre o detalhe e o fundo (clareie ou escureça um deles).
						</p>
					{/if}

					<button
						class="tone-lock"
						class:locked={advisory.tokens.backgroundLocked}
						type="button"
						aria-pressed={advisory.tokens.backgroundLocked}
						disabled={loadFailed}
						aria-label={`${
							advisory.tokens.backgroundLocked
								? 'Destravar o fundo (voltar ao automático)'
								: 'Travar o fundo (modo manual)'
						} do tom ${TONE_LABELS[advisory.tone]}. O fundo está ${
							advisory.tokens.backgroundLocked
								? 'travado: mudar o detalhe não altera o fundo'
								: 'automático: o fundo acompanha o detalhe'
						}.`}
						title={advisory.tokens.backgroundLocked
							? 'Fundo travado: mudar o detalhe não altera o fundo. Clique para destravar e recalcular a sugestão a partir do detalhe.'
							: 'Fundo automático: acompanha o detalhe. Clique para travar e fixar o valor manual.'}
						onclick={() =>
							setStatusToneBackgroundLocked(
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

<ConfirmDialog
	open={confirmLowContrast}
	title="Salvar com contraste abaixo do mínimo?"
	description="Algumas combinações de cor ficaram abaixo do mínimo recomendado de contraste (WCAG AA). Isso é apenas um aviso — você pode salvar mesmo assim."
	confirmLabel="Salvar assim mesmo"
	cancelLabel="Revisar cores"
	onConfirm={() => {
		confirmLowContrast = false;
		void persistSave();
	}}
	onClose={() => (confirmLowContrast = false)}
/>

<style>
	.palette-toolbar {
		display: flex;
	}

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

	.section-head {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.section-title {
		margin: 0;
		font: var(--label);
		font-size: 13px;
		color: var(--text-color-secondary);
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}

	.section-note {
		margin: 0;
		font-size: 12px;
		color: var(--text-color-secondary);
	}

	.token-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.token-group-title {
		margin: 0;
		font: var(--label);
		font-size: 12px;
		color: var(--text-color-secondary);
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}

	.token-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		align-items: start;
		gap: var(--spacing-md);
	}

	.token-field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		min-width: 0;
	}

	.field-advice {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 0;
		font-size: 12px;
		color: var(--text-color-secondary);
	}

	.field-advice.fail {
		color: var(--status-warning);
	}

	.field-advice-icon {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--status-success);
	}

	.field-advice.fail .field-advice-icon {
		color: var(--status-warning);
	}

	.gradient-editor {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-md);
	}

	.gradient-preview {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 120px;
		height: 56px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.gradient-sample {
		font: var(--h4);
	}

	.gradient-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		align-items: start;
		gap: var(--spacing-md);
		flex: 1;
		min-width: 260px;
	}

	.gradient-angle {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.gradient-angle-label {
		font: var(--label);
		font-size: 13px;
		color: var(--text-color-primary);
	}

	.gradient-angle-input {
		height: 32px;
		box-sizing: border-box;
		padding: 0 var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--text-color-primary);
		font: var(--label);
		font-size: 13px;
	}

	.gradient-advice {
		flex-basis: 100%;
		text-align: left;
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

	.advice-icon {
		display: inline-flex;
		vertical-align: -3px;
		margin-right: 4px;
		color: var(--status-success);
	}

	.tone-advice li.fail .advice-icon {
		color: var(--status-warning);
	}

	.tone-fix {
		flex-basis: 100%;
		margin: 0;
		font-size: 12px;
		color: var(--status-warning);
	}

	.tone-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
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
		.tone-fields,
		.gradient-fields {
			grid-template-columns: 1fr;
		}

		.gradient-preview {
			width: 100%;
		}
	}
</style>
