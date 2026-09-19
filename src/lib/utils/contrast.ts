// Utilitários puros do contrast advisor — cálculo de contraste WCAG e
// sugestões de cor. Nenhum estado ou acesso ao DOM: a UI decide quando avisar
// e o salvamento nunca é bloqueado por um contraste ruim.

// Mínimos WCAG usados pelo advisor.
export const MIN_AA_NORMAL = 4.5;
export const MIN_AA_LARGE = 3;
// Visibilidade de elementos não textuais (ponto/borda do status).
export const MIN_NON_TEXT = 3;

export type ContrastLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';

interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number;
}

// Aceita #RRGGBB ou #RRGGBBAA (mesmo formato de isValidHexColor). Alpha
// ausente vale 1. Qualquer valor inválido cai em preto opaco para o cálculo
// não lançar durante a renderização.
function parseHexColor(value: string): Rgba {
	const match = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(value.trim());
	if (!match) {
		return { r: 0, g: 0, b: 0, a: 1 };
	}

	const hex = match[1];
	return {
		r: parseInt(hex.slice(0, 2), 16),
		g: parseInt(hex.slice(2, 4), 16),
		b: parseInt(hex.slice(4, 6), 16),
		a: match[2] ? parseInt(match[2], 16) / 255 : 1
	};
}

function toHexChannel(channel: number): string {
	return Math.round(channel).toString(16).padStart(2, '0');
}

// Compõe uma cor possivelmente translúcida sobre uma base opaca — necessário
// porque `background` do status costuma ser ~10% do acento (#RRGGBBAA) e o
// contraste só faz sentido medido contra o que de fato aparece na tela.
export function flattenColor(color: string, base: string): string {
	const fg = parseHexColor(color);
	const bg = parseHexColor(base);

	if (fg.a >= 1) {
		return `#${toHexChannel(fg.r)}${toHexChannel(fg.g)}${toHexChannel(fg.b)}`;
	}

	const blend = (channel: number, baseChannel: number) => channel * fg.a + baseChannel * (1 - fg.a);

	return `#${toHexChannel(blend(fg.r, bg.r))}${toHexChannel(blend(fg.g, bg.g))}${toHexChannel(
		blend(fg.b, bg.b)
	)}`;
}

// Luminância relativa conforme WCAG 2.x (canais linearizados por sRGB).
export function relativeLuminance(color: string): number {
	const { r, g, b } = parseHexColor(color);
	const linear = [r, g, b].map((channel) => {
		const value = channel / 255;
		return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
	});

	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

// Razão de contraste entre texto e fundo. O fundo (e o texto, se translúcido)
// é composto sobre `base` antes da medição; `base` deve ser a superfície real
// atrás do par (ex.: superfície do card ou fundo da página).
export function contrastRatio(foreground: string, background: string, base: string): number {
	const flattenedBackground = flattenColor(background, base);
	const flattenedForeground = flattenColor(foreground, flattenedBackground);

	const l1 = relativeLuminance(flattenedForeground);
	const l2 = relativeLuminance(flattenedBackground);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

// Classificação WCAG para texto normal — usada como rótulo do score.
export function classifyContrast(ratio: number): ContrastLevel {
	if (ratio >= 7) return 'AAA';
	if (ratio >= MIN_AA_NORMAL) return 'AA';
	if (ratio >= MIN_AA_LARGE) return 'AA-large';
	return 'fail';
}

export function meetsMinimum(ratio: number, minimum: number): boolean {
	return ratio + 1e-9 >= minimum;
}

// Luminosidade-alvo do fundo de status no dark — sólido escuro derivado do
// acento, na linha dos containers do design system (`#4c0f0a`, `#0f2e1d`...).
const DARK_STATUS_BACKGROUND_LIGHTNESS = 0.18;

// Converte canais 0..255 para HSL (h em graus, s/l em 0..1).
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h: number;
	if (max === rn) {
		h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
	} else if (max === gn) {
		h = ((bn - rn) / d + 2) * 60;
	} else {
		h = ((rn - gn) / d + 4) * 60;
	}

	return { h, s, l };
}

// Componentes RGB normalizados (0..1) da matiz, conforme o setor de 60°.
function hueToRgb(h: number, c: number, x: number): [number, number, number] {
	if (h < 60) return [c, x, 0];
	if (h < 120) return [x, c, 0];
	if (h < 180) return [0, c, x];
	if (h < 240) return [0, x, c];
	if (h < 300) return [x, 0, c];
	return [c, 0, x];
}

// HSL (h em graus, s/l em 0..1) de volta para #RRGGBB.
function hslToHex(h: number, s: number, l: number): string {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	const [r, g, b] = hueToRgb(h, c, x);

	return `#${toHexChannel((r + m) * 255)}${toHexChannel((g + m) * 255)}${toHexChannel((b + m) * 255)}`;
}

// Escurece a cor até a luminosidade-alvo preservando matiz e saturação; nunca
// clareia (usa o menor entre L atual e o alvo).
export function darkenToLightness(color: string, targetLightness: number): string {
	const { r, g, b } = parseHexColor(color);
	const { h, s, l } = rgbToHsl(r, g, b);
	return hslToHex(h, s, Math.min(l, targetLightness));
}

// Sugestão do fundo de status a partir do acento, ciente da paleta:
// - light: o acento translúcido (~10%, alpha 0x1a);
// - dark: um sólido escuro (o acento escurecido), alinhado aos containers dark.
// Valor puramente sugestivo — o admin pode editar livremente.
export function suggestStatusBackground(accent: string, palette: 'light' | 'dark'): string {
	const match = /^#([0-9a-fA-F]{6})/.exec(accent.trim());
	const rgb = match ? `#${match[1].toLowerCase()}` : '#000000';

	if (palette === 'dark') {
		return darkenToLightness(rgb, DARK_STATUS_BACKGROUND_LIGHTNESS);
	}

	return `${rgb}1a`;
}
