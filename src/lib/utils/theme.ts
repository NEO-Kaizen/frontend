import { STATUS_TONES, THEME_TOKEN_KEYS } from '$lib/types/portal-config';
import type { PortalTheme, ThemeTokenKey, ThemeTokens } from '$lib/types/portal-config';

// Sufixo de custom property por papel da paleta — espelha o mapeamento em
// global.css (`.app-root` e `[data-theme='dark'] .app-root`).
const TOKEN_VAR_SUFFIX: Record<ThemeTokenKey, string> = {
	background: 'background',
	surface: 'surface',
	border: 'border',
	textPrimary: 'text-primary',
	textSecondary: 'text-secondary',
	heading: 'heading',
	richBlack: 'rich-black',
	primary: 'primary',
	secondary: 'secondary',
	tint: 'tint',
	onPrimary: 'on-primary',
	onDark: 'on-dark',
	onGradient: 'on-gradient'
};

// Ângulo padrão do gradiente quando a paleta não define um.
const DEFAULT_GRADIENT_ANGLE = 143;

// Serializa uma paleta como custom properties com prefixo (`--light-*` /
// `--dark-*`). O Svelte 5 não interpola `{expr}` em `<style>`, então o tema é
// injetado via atributo `style` no wrapper do +layout.svelte. Os valores são
// hex já sanitizados pela camada de service.
export function paletteStyleVars(prefix: 'light' | 'dark', tokens: ThemeTokens): string {
	const vars = THEME_TOKEN_KEYS.map((key) => `--${prefix}-${TOKEN_VAR_SUFFIX[key]}:${tokens[key]}`);

	for (const tone of STATUS_TONES) {
		const toneTokens = tokens.statuses[tone];
		vars.push(`--${prefix}-status-${tone}:${toneTokens.color}`);
		vars.push(`--${prefix}-status-${tone}-bg:${toneTokens.background}`);
	}

	// Gradiente da paleta — valores separados e o composto pronto para uso. O
	// mapeamento para os nomes canônicos fica no global.css (branch de dark mode).
	const { from, to } = tokens.gradient;
	const angle = tokens.gradient.angle ?? DEFAULT_GRADIENT_ANGLE;
	vars.push(`--${prefix}-gradient-from:${from}`);
	vars.push(`--${prefix}-gradient-to:${to}`);
	vars.push(`--${prefix}-gradient-angle:${angle}`);
	vars.push(`--${prefix}-gradient:linear-gradient(${angle}deg, ${from}, ${to})`);

	return vars.join(';');
}

// As duas paletas juntas — o CSS estático escolhe qual vale conforme o atributo
// `data-theme` no `<html>`.
export function themeStyleVars(theme: PortalTheme): string {
	return `${paletteStyleVars('light', theme.light)};${paletteStyleVars('dark', theme.dark)}`;
}
