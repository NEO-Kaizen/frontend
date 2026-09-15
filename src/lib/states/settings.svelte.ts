import { getContext, setContext } from 'svelte';
import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import { savePortalConfig, uploadAsset } from '$lib/config/portal-config.service';
import type { Result } from '$lib/types/result';
import { ASSET_KEYS, PRIORITIZATION_CRITERIA } from '$lib/types/portal-config';
import type {
	AssetKey,
	PortalCategory,
	PortalConfig,
	PortalAssetsPatch,
	PortalStatus,
	PrioritizationCriterion,
	StatusTone,
	ThemePalette,
	ThemeTokenKey,
	UpdatePortalConfigPayload
} from '$lib/types/portal-config';
import { suggestStatusBackground } from '$lib/utils/contrast';
import {
	isValidPlatformName,
	isValidProtocolMask,
	isValidCategoryName,
	isValidCategoryDescription,
	isValidStatusName,
	isValidPrioritizationWeight,
	areCategoryNamesUnique,
	hasActiveCategory,
	areStatusNamesUnique,
	MAX_CATEGORIES,
	MAX_STATUSES
} from '$lib/utils/validations';

const SAVE_SUCCESS_MESSAGE = 'Configurações salvas com sucesso.';

// Chave do contexto que expõe o estado de edição de configurações para a
// página e seus cards. O estado é criado uma vez por página (ver
// `provideSettingsState`) em vez de ser um singleton de módulo global.
const SETTINGS_CONTEXT_KEY = Symbol('settings-state');

// Feedback unificado: `message` e `type` sempre caminham juntos, evitando o
// estado inválido de ter mensagem sem tipo (ou vice-versa).
export interface SettingsFeedback {
	type: 'success' | 'error';
	message: string;
}

// Campos escalares editáveis — usados pelo `setField` tipado.
export type ScalarConfigField = 'solicitationMode' | 'platformName' | 'protocolMask';

function hasChanged(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) !== JSON.stringify(b);
}

function nextId(items: { id: number }[]): number {
	return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

function replaceById<T extends { id: number }>(items: T[], id: number, patch: Partial<T>): T[] {
	return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function removeById<T extends { id: number }>(items: T[], id: number): T[] {
	return items.filter((item) => item.id !== id);
}

// `pristine` espelha o que está salvo no servidor; `draft` carrega os valores
// em edição na UI — assim dá para saber se houve mudança e reverter o rascunho.
export class SettingsState {
	pristine: PortalConfig = $state(structuredClone(DEFAULT_PORTAL_CONFIG));
	draft: PortalConfig = $state(structuredClone(DEFAULT_PORTAL_CONFIG));
	saving: boolean = $state(false);
	// Asset atualmente em upload (Card 4) — drive o loading dos botões.
	uploadingAsset: AssetKey | null = $state(null);
	feedback: SettingsFeedback | null = $state(null);

	dirty: boolean = $derived(
		this.draft.platformName.trim() !== this.pristine.platformName.trim() ||
			this.draft.protocolMask.trim() !== this.pristine.protocolMask.trim() ||
			this.draft.solicitationMode !== this.pristine.solicitationMode ||
			ASSET_KEYS.some((key) => this.draft.assets[key] !== this.pristine.assets[key]) ||
			hasChanged(this.draft.theme, this.pristine.theme) ||
			hasChanged(this.draft.categories, this.pristine.categories) ||
			hasChanged(this.draft.statuses, this.pristine.statuses) ||
			hasChanged(this.draft.prioritizationWeights, this.pristine.prioritizationWeights)
	);

	// Valida apenas os campos editáveis — o rádio de modo de acesso não tem
	// caso de erro. Vazio também é inválido para impedir salvar sem valor.
	fieldErrors: { platformName?: string; protocolMask?: string } = $derived({
		...(isValidPlatformName(this.draft.platformName)
			? {}
			: { platformName: 'Informe um nome com até 80 caracteres.' }),
		...(isValidProtocolMask(this.draft.protocolMask)
			? {}
			: { protocolMask: 'Apenas letras e números, até 10 caracteres.' })
	});

	// Erro global de categorias (Card 5) — aja na lista inteira: nome vazio,
	// nome duplicado, nenhuma ativa ou limite de itens. Sem categoria inválida,
	// fica null e o campo não bloqueia o salvamento.
	categoriesError: string | null = $derived.by(() => {
		const categories = this.draft.categories;

		if (categories.length === 0) {
			return 'Adicione ao menos uma categoria.';
		}
		if (categories.length > MAX_CATEGORIES) {
			return `O limite é de ${MAX_CATEGORIES} categorias.`;
		}
		if (
			categories.some(
				(category) =>
					!isValidCategoryName(category.name) || !isValidCategoryDescription(category.description)
			)
		) {
			return 'Preencha nome (até 40 caracteres) e descrição (até 200 caracteres) de cada categoria.';
		}
		if (!areCategoryNamesUnique(categories)) {
			return 'Nomes de categoria não podem se repetir.';
		}
		if (!hasActiveCategory(categories)) {
			return 'Mantenha ao menos uma categoria ativa.';
		}
		return null;
	});

	// Erro global de status (Card 6) — equivale ao de categorias: lista vazia,
	// limite de itens, nome inválido ou nome duplicado.
	statusesError: string | null = $derived.by(() => {
		const statuses = this.draft.statuses;

		if (statuses.length === 0) {
			return 'Adicione ao menos um status.';
		}
		if (statuses.length > MAX_STATUSES) {
			return `O limite é de ${MAX_STATUSES} status.`;
		}
		if (statuses.some((status) => !isValidStatusName(status.name))) {
			return 'Preencha o nome (até 40 caracteres) de cada status.';
		}
		if (!areStatusNamesUnique(statuses)) {
			return 'Nomes de status não podem se repetir.';
		}
		return null;
	});

	// Erro global de pesos de priorização (Card 7) — qualquer peso fora de
	// 1.0..5.0 (passo 0.5) bloqueia o salvamento.
	prioritizationWeightsError: string | null = $derived.by(() => {
		const weights = this.draft.prioritizationWeights;

		const hasInvalidWeight = PRIORITIZATION_CRITERIA.some(
			(criterion) => !isValidPrioritizationWeight(weights[criterion])
		);

		return hasInvalidWeight ? 'Os pesos devem estar entre 1,0 e 5,0 (passo 0,5).' : null;
	});

	hasValidationErrors: boolean = $derived(
		this.fieldErrors.platformName !== undefined ||
			this.fieldErrors.protocolMask !== undefined ||
			this.categoriesError !== null ||
			this.statusesError !== null ||
			this.prioritizationWeightsError !== null
	);

	init(config: PortalConfig): void {
		this.pristine = structuredClone(config);
		this.draft = structuredClone(config);
		this.saving = false;
		this.clearFeedback();
	}

	clearFeedback(): void {
		this.feedback = null;
	}

	// Atualiza um campo escalar do draft — substitui os setters espelhados.
	setField<K extends ScalarConfigField>(field: K, value: PortalConfig[K]): void {
		this.draft = { ...this.draft, [field]: value };
		this.clearFeedback();
	}

	// ---- Tema / identidade visual (Card 3) ----

	// Atualiza um papel da paleta em edição. O tema é atômico no save, então
	// qualquer mudança marca `dirty` via `hasChanged(draft.theme, pristine.theme)`.
	setThemeToken(palette: ThemePalette, key: ThemeTokenKey, value: string): void {
		this.draft = {
			...this.draft,
			theme: {
				...this.draft.theme,
				[palette]: { ...this.draft.theme[palette], [key]: value }
			}
		};
		this.clearFeedback();
	}

	// Atualiza o fundo de um tom de status. O rótulo e o ponto usam o acento
	// (`color`), então não há uma terceira cor a manter. Editar o fundo trava o
	// modo automático (`backgroundLocked = true`): o acento não o sobrescreve.
	setStatusToneBackground(palette: ThemePalette, tone: StatusTone, value: string): void {
		this.draft = {
			...this.draft,
			theme: {
				...this.draft.theme,
				[palette]: {
					...this.draft.theme[palette],
					statuses: {
						...this.draft.theme[palette].statuses,
						[tone]: {
							...this.draft.theme[palette].statuses[tone],
							background: value,
							backgroundLocked: true
						}
					}
				}
			}
		};
		this.clearFeedback();
	}

	// Trava/destrava o fundo do tom. Destravar é pedir a sugestão: recalcula o
	// fundo na hora a partir do acento atual (e passa a acompanhá-lo). Travar
	// preserva o valor manual.
	setStatusToneBackgroundLocked(palette: ThemePalette, tone: StatusTone, locked: boolean): void {
		const current = this.draft.theme[palette].statuses[tone];

		this.draft = {
			...this.draft,
			theme: {
				...this.draft.theme,
				[palette]: {
					...this.draft.theme[palette],
					statuses: {
						...this.draft.theme[palette].statuses,
						[tone]: {
							...current,
							backgroundLocked: locked,
							background: locked
								? current.background
								: suggestStatusBackground(current.color, palette)
						}
					}
				}
			}
		};
		this.clearFeedback();
	}

	// Muda o acento de um tom. Em modo automático (`backgroundLocked` falso),
	// recalcula o fundo a partir do acento (ciente da paleta); travado, preserva
	// o fundo manual.
	updateStatusToneColor(palette: ThemePalette, tone: StatusTone, color: string): void {
		const current = this.draft.theme[palette].statuses[tone];

		this.draft = {
			...this.draft,
			theme: {
				...this.draft.theme,
				[palette]: {
					...this.draft.theme[palette],
					statuses: {
						...this.draft.theme[palette].statuses,
						[tone]: {
							...current,
							color,
							background: current.backgroundLocked
								? current.background
								: suggestStatusBackground(color, palette)
						}
					}
				}
			}
		};
		this.clearFeedback();
	}

	// ---- Categorias da demanda (Card 5) ----

	// Operações imutáveis sobre a lista do draft; o erro de validação é
	// derivado (categoriesError) e exibido inline pelo card. Novos ids são
	// números inteiros gerados localmente (maior id atual + 1), aceitos pela
	// API em categorias novas (contrato 3.2.2).
	addCategory(): void {
		this.draft = {
			...this.draft,
			categories: [
				...this.draft.categories,
				{
					id: nextId(this.draft.categories),
					name: '',
					description: '',
					isActive: true
				}
			]
		};
		this.clearFeedback();
	}

	updateCategory(
		id: number,
		patch: Partial<Pick<PortalCategory, 'name' | 'description' | 'isActive'>>
	): void {
		this.draft = {
			...this.draft,
			categories: replaceById<PortalCategory>(this.draft.categories, id, patch)
		};
		this.clearFeedback();
	}

	toggleCategory(id: number): void {
		this.updateCategory(id, {
			isActive: !this.draft.categories.find((category) => category.id === id)?.isActive
		});
	}

	removeCategory(id: number): void {
		this.draft = { ...this.draft, categories: removeById(this.draft.categories, id) };
		this.clearFeedback();
	}

	// Move uma categoria para a posição da categoria alvo (reordenação por
	// arraste no Card 5). A lista continua atômica: a nova ordem é preservada
	// no PATCH e exibida conforme o array.
	reorderCategory(fromId: number, toId: number): void {
		const fromIndex = this.draft.categories.findIndex((category) => category.id === fromId);
		const toIndex = this.draft.categories.findIndex((category) => category.id === toId);
		if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

		const reordered = [...this.draft.categories];
		const [moved] = reordered.splice(fromIndex, 1);
		reordered.splice(toIndex, 0, moved);

		this.draft = { ...this.draft, categories: reordered };
		this.clearFeedback();
	}

	// ---- Status do ciclo de vida (Card 6) ----

	// Mesmas regras das categorias: operações imutáveis sobre a lista do draft,
	// erro de validação derivado (statusesError) e exibido inline pelo card.
	// Novos ids são números inteiros gerados localmente (maior id atual + 1).
	addStatus(): void {
		this.draft = {
			...this.draft,
			statuses: [
				...this.draft.statuses,
				{
					id: nextId(this.draft.statuses),
					name: '',
					visibility: 'PUBLIC',
					closesRequest: false,
					tone: 'info'
				}
			]
		};
		this.clearFeedback();
	}

	updateStatus(
		id: number,
		patch: Partial<Pick<PortalStatus, 'name' | 'visibility' | 'closesRequest' | 'tone'>>
	): void {
		this.draft = {
			...this.draft,
			statuses: replaceById<PortalStatus>(this.draft.statuses, id, patch)
		};
		this.clearFeedback();
	}

	removeStatus(id: number): void {
		this.draft = { ...this.draft, statuses: removeById(this.draft.statuses, id) };
		this.clearFeedback();
	}

	// ---- Pesos da priorização (Card 7) ----

	// Atualiza um único peso no objeto do draft; o erro de validação é
	// derivado (prioritizationWeightsError) e exibido inline pelo card.
	setPrioritizationWeight(criterion: PrioritizationCriterion, value: number): void {
		this.draft = {
			...this.draft,
			prioritizationWeights: {
				...this.draft.prioritizationWeights,
				[criterion]: value
			}
		};
		this.clearFeedback();
	}

	// Faz upload imediato do asset selecionado (Card 4) e atualiza o draft com
	// a URL retornada. O erro de validação/upload é devolvido no Result para o
	// card exibir inline (não vai para o feedback global do rodapé).
	async changeAsset(asset: AssetKey, file: File): Promise<Result<string>> {
		this.uploadingAsset = asset;
		this.clearFeedback();

		try {
			const result = await uploadAsset(asset, file);

			if (result.ok) {
				this.draft = {
					...this.draft,
					assets: { ...this.draft.assets, [asset]: result.data }
				};
			}

			return result;
		} finally {
			this.uploadingAsset = null;
		}
	}

	// `$state.snapshot` produz um clone plano — `structuredClone` direto sobre
	// um proxy de `$state` lançaria `DataCloneError`.
	reset(): void {
		this.draft = structuredClone($state.snapshot(this.pristine));
		this.clearFeedback();
	}

	restoreDefaults(): void {
		this.draft = structuredClone(DEFAULT_PORTAL_CONFIG);
		this.clearFeedback();
	}

	async save(): Promise<void> {
		try {
			this.saving = true;
			this.clearFeedback();

			if (this.hasValidationErrors) {
				this.feedback = {
					type: 'error',
					message: 'Corrija os campos destacados antes de salvar.'
				};
				return;
			}

			// Payload mínimo: envia apenas os campos que diferem do salvo.
			const payload: UpdatePortalConfigPayload = {};

			if (this.draft.solicitationMode !== this.pristine.solicitationMode) {
				payload.solicitationMode = this.draft.solicitationMode;
			}
			if (this.draft.platformName.trim() !== this.pristine.platformName.trim()) {
				payload.platformName = this.draft.platformName.trim();
			}
			if (this.draft.protocolMask.trim() !== this.pristine.protocolMask.trim()) {
				payload.protocolMask = this.draft.protocolMask.trim();
			}

			const assetsPatch: PortalAssetsPatch = {};
			for (const key of ASSET_KEYS) {
				if (this.draft.assets[key] !== this.pristine.assets[key]) {
					assetsPatch[key] = this.draft.assets[key];
				}
			}
			if (Object.keys(assetsPatch).length > 0) {
				payload.assets = assetsPatch;
			}

			// O tema é atômico: qualquer diferença envia as duas paletas completas.
			if (hasChanged(this.draft.theme, this.pristine.theme)) {
				payload.theme = $state.snapshot(this.draft.theme);
			}

			// Categorias são atômicas: qualquer diferença envia a lista completa.
			if (hasChanged(this.draft.categories, this.pristine.categories)) {
				payload.categories = $state.snapshot(this.draft.categories);
			}

			// Status são atômicos: qualquer diferença envia a lista completa.
			if (hasChanged(this.draft.statuses, this.pristine.statuses)) {
				payload.statuses = $state.snapshot(this.draft.statuses);
			}

			// Pesos de priorização são atômicos: qualquer diferença envia o
			// objeto completo (todas as chaves da allowlist).
			if (hasChanged(this.draft.prioritizationWeights, this.pristine.prioritizationWeights)) {
				payload.prioritizationWeights = { ...this.draft.prioritizationWeights };
			}

			const result = await savePortalConfig(payload);

			if (result.ok) {
				this.pristine = structuredClone(result.data);
				this.draft = structuredClone(result.data);
				this.feedback = { type: 'success', message: SAVE_SUCCESS_MESSAGE };
			} else {
				this.feedback = { type: 'error', message: result.error.message };
			}
		} finally {
			this.saving = false;
		}
	}
}

// Cria o estado uma vez por página e o disponibiliza via contexto — o estado é
// local à rota de Configurações, não um singleton global (docs/02 §3 e §15).
export function provideSettingsState(config: PortalConfig): SettingsState {
	const settingsState = new SettingsState();
	settingsState.init(config);
	setContext(SETTINGS_CONTEXT_KEY, settingsState);
	return settingsState;
}

export function getSettingsState(): SettingsState {
	const settingsState = getContext<SettingsState | undefined>(SETTINGS_CONTEXT_KEY);

	if (!settingsState) {
		throw new Error('SettingsState não encontrado no contexto da página de configurações.');
	}

	return settingsState;
}
