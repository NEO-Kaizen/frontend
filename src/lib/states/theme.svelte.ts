import { browser } from '$app/environment';
import { themeStyleVars } from '$lib/utils/theme';
import type { PortalTheme } from '$lib/types/portal-config';

// Preferência de tema do usuário (claro/escuro). É uma decisão local do
// cliente — não faz parte do PortalConfig — por isso vive fora do
// SettingsState e é persistida em localStorage. O atributo `data-theme` no
// `<html>` é o que faz o CSS ativo escolher a paleta (ver global.css).

export type ThemeMode = 'light' | 'dark';

// Mesma chave lida pelo script anti-FOUC no app.html — manter em sincronia.
const STORAGE_KEY = 'maat:theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStoredMode(): ThemeMode | null {
	if (!browser) return null;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === 'light' || stored === 'dark' ? stored : null;
	} catch {
		return null;
	}
}

// Sem preferência salva, o tema segue o sistema operacional.
function systemMode(): ThemeMode {
	if (!browser) return 'light';
	return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function applyThemeAttribute(mode: ThemeMode): void {
	if (!browser) return;
	document.documentElement.setAttribute('data-theme', mode);
}

let mode = $state<ThemeMode>(readStoredMode() ?? systemMode());

// Enquanto o usuário não escolher explicitamente, variações do sistema
// atualizam o tema em tempo real.
if (browser && readStoredMode() === null) {
	window.matchMedia(DARK_QUERY).addEventListener('change', (event) => {
		if (readStoredMode() !== null) return;
		mode = event.matches ? 'dark' : 'light';
		applyThemeAttribute(mode);
	});
}

export function getThemeMode(): ThemeMode {
	return mode;
}

export function setThemeMode(next: ThemeMode): void {
	mode = next;
	applyThemeAttribute(next);

	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// localStorage indisponível (modo privado): a preferência vale só a sessão.
	}
}

export function toggleTheme(): void {
	setThemeMode(mode === 'dark' ? 'light' : 'dark');
}

// Pré-visualização de paleta (tela de configurações): aplica um tema sem mexer
// na preferência persistida. `endPreviewTheme` devolve o tema real do usuário —
// usado quando a página de configurações é desmontada.
export function previewThemeMode(preview: ThemeMode): void {
	applyThemeAttribute(preview);
}

export function endPreviewTheme(): void {
	applyThemeAttribute(mode);
}

// Pré-visualização das cores do tema (tela de configurações): escreve as duas
// paletas como custom properties no wrapper `.app-root`, sobrepondo a paleta
// salva que o +layout.svelte injeta via `style`. Como só o seletor `.app-root`
// resolve `--light-*`/`--dark-*` para os tokens canônicos, o preview precisa
// escrever no mesmo elemento — daí a manipulação direta do atributo `style`.
export function previewPortalTheme(theme: PortalTheme): void {
	if (!browser) return;

	document.querySelector<HTMLElement>('.app-root')?.setAttribute('style', themeStyleVars(theme));
}
