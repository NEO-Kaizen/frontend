import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import { savePortalConfig, uploadAsset } from '$lib/config/portal-config.service';
import { ASSET_KEYS } from '$lib/types/portal-config';
import type {
	AssetKey,
	PortalCategory,
	PortalConfig,
	PortalAssetsPatch,
	PortalStatus,
	SolicitationMode,
	UpdatePortalConfigPayload
} from '$lib/types/portal-config';
import {
	isValidPlatformName,
	isValidProtocolMask,
	isValidCategoryName,
	isValidCategoryDescription,
	isValidStatusName,
	areCategoryNamesUnique,
	hasActiveCategory,
	areStatusNamesUnique,
	MAX_CATEGORIES,
	MAX_STATUSES
} from '$lib/utils/validations';

const SAVE_SUCCESS_MESSAGE = 'Configurações salvas com sucesso.';

// `pristine` espelha o que está salvo no servidor; `draft` carrega os valores
// em edição na UI — assim dá para saber se houve mudança e reverter o rascunho.
export class SettingsState {
	pristine: PortalConfig = $state(structuredClone(DEFAULT_PORTAL_CONFIG));
	draft: PortalConfig = $state(structuredClone(DEFAULT_PORTAL_CONFIG));
	saving: boolean = $state(false);
	// Asset atualmente em upload (Card 4) — drive o loading dos botões.
	uploadingAsset: AssetKey | null = $state(null);
	feedback: string | null = $state(null);
	feedbackType: 'success' | 'error' | null = $state(null);

	dirty: boolean = $derived(
		this.draft.platformName !== this.pristine.platformName ||
			this.draft.protocolMask !== this.pristine.protocolMask ||
			this.draft.solicitationMode !== this.pristine.solicitationMode ||
			ASSET_KEYS.some((key) => this.draft.assets[key] !== this.pristine.assets[key]) ||
			JSON.stringify(this.draft.categories) !== JSON.stringify(this.pristine.categories) ||
			JSON.stringify(this.draft.statuses) !== JSON.stringify(this.pristine.statuses)
	);

	// Valida apenas os campos editáveis — o rádio de modo de acesso não tem
	// caso de erro. Vazio também é inválido para impedir salvar sem valor.
	fieldErrors: { platformName?: string; protocolMask?: string } = $derived({
		...(isValidPlatformName(this.draft.platformName)
			? {}
			: { platformName: 'Informe um nome com até 80 caracteres.' }),
		...(isValidProtocolMask(this.draft.protocolMask)
			? {}
			: { protocolMask: 'Use letras, números ou hífen, até 40 caracteres.' })
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

	hasValidationErrors: boolean = $derived(
		this.fieldErrors.platformName !== undefined ||
			this.fieldErrors.protocolMask !== undefined ||
			this.categoriesError !== null ||
			this.statusesError !== null
	);

	init(config: PortalConfig): void {
		this.pristine = structuredClone(config);
		this.draft = structuredClone(config);
		this.saving = false;
		this.feedback = null;
		this.feedbackType = null;
	}

	setSolicitationMode(mode: SolicitationMode): void {
		this.draft = { ...this.draft, solicitationMode: mode };
		this.feedback = null;
		this.feedbackType = null;
	}

	setPlatformName(value: string): void {
		this.draft = { ...this.draft, platformName: value };
		this.feedback = null;
		this.feedbackType = null;
	}

	setProtocolMask(value: string): void {
		this.draft = { ...this.draft, protocolMask: value };
		this.feedback = null;
		this.feedbackType = null;
	}

	// ---- Categorias da demanda (Card 5) ----

	// Operações imutáveis sobre a lista do draft; o erro de validação é
	// derivado (categoriesError) e exibido inline pelo card. Novos ids são
	// números inteiros gerados localmente (maior id atual + 1), aceitos pela
	// API em categorias novas (contrato 3.2.2).
	addCategory(): void {
		const ids = this.draft.categories.map((category) => category.id);
		const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

		this.draft = {
			...this.draft,
			categories: [
				...this.draft.categories,
				{
					id: nextId,
					name: '',
					description: '',
					isActive: true
				}
			]
		};
		this.feedback = null;
		this.feedbackType = null;
	}

	updateCategory(
		id: number,
		patch: Partial<Pick<PortalCategory, 'name' | 'description' | 'isActive'>>
	): void {
		this.draft = {
			...this.draft,
			categories: this.draft.categories.map((category) =>
				category.id === id ? { ...category, ...patch } : category
			)
		};
		this.feedback = null;
		this.feedbackType = null;
	}

	toggleCategory(id: number): void {
		this.updateCategory(id, {
			isActive: !this.draft.categories.find((category) => category.id === id)?.isActive
		});
	}

	removeCategory(id: number): void {
		this.draft = {
			...this.draft,
			categories: this.draft.categories.filter((category) => category.id !== id)
		};
		this.feedback = null;
		this.feedbackType = null;
	}

	// ---- Status do ciclo de vida (Card 6) ----

	// Mesmas regras das categorias: operações imutáveis sobre a lista do draft,
	// erro de validação derivado (statusesError) e exibido inline pelo card.
	// Novos ids são números inteiros gerados localmente (maior id atual + 1).
	addStatus(): void {
		const ids = this.draft.statuses.map((status) => status.id);
		const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

		this.draft = {
			...this.draft,
			statuses: [
				...this.draft.statuses,
				{
					id: nextId,
					name: '',
					visibility: 'PUBLIC',
					closesRequest: false,
					tone: 'open'
				}
			]
		};
		this.feedback = null;
		this.feedbackType = null;
	}

	updateStatus(
		id: number,
		patch: Partial<Pick<PortalStatus, 'name' | 'visibility' | 'closesRequest' | 'tone'>>
	): void {
		this.draft = {
			...this.draft,
			statuses: this.draft.statuses.map((status) =>
				status.id === id ? { ...status, ...patch } : status
			)
		};
		this.feedback = null;
		this.feedbackType = null;
	}

	removeStatus(id: number): void {
		this.draft = {
			...this.draft,
			statuses: this.draft.statuses.filter((status) => status.id !== id)
		};
		this.feedback = null;
		this.feedbackType = null;
	}

	// Faz upload imediato do asset selecionado (Card 4) e atualiza o draft com
	// a URL retornada; erros de validação/upload caem no feedback global.
	async changeAsset(asset: AssetKey, file: File): Promise<string | null> {
		this.uploadingAsset = asset;
		this.feedback = null;
		this.feedbackType = null;

		try {
			const result = await uploadAsset(asset, file);

			if (!result.ok) {
				this.feedbackType = 'error';
				this.feedback = result.error.message;
				return null;
			}

			this.draft = {
				...this.draft,
				assets: { ...this.draft.assets, [asset]: result.data }
			};

			return result.data;
		} finally {
			this.uploadingAsset = null;
		}
	}

	reset(): void {
		this.draft = structuredClone(this.pristine);
		this.feedback = null;
		this.feedbackType = null;
	}

	showSuccess(): void {
		this.feedbackType = 'success';
		this.feedback = SAVE_SUCCESS_MESSAGE;
	}

	restoreDefaults(): void {
		this.draft = structuredClone(DEFAULT_PORTAL_CONFIG);
		this.feedback = null;
		this.feedbackType = null;
	}

	async save(): Promise<void> {
		try {
			this.saving = true;
			this.feedback = null;
			this.feedbackType = null;

			if (this.hasValidationErrors) {
				this.feedbackType = 'error';
				this.feedback = 'Corrija os campos destacados antes de salvar.';
				return;
			}

			// Payload mínimo: envia apenas os campos que diferem do salvo.
			const payload: UpdatePortalConfigPayload = {};

			if (this.draft.solicitationMode !== this.pristine.solicitationMode) {
				payload.solicitationMode = this.draft.solicitationMode;
			}
			if (this.draft.platformName.trim() !== this.pristine.platformName) {
				payload.platformName = this.draft.platformName.trim();
			}
			if (this.draft.protocolMask.trim() !== this.pristine.protocolMask) {
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

			// Categorias são atômicas: qualquer diferença envia a lista completa.
			if (JSON.stringify(this.draft.categories) !== JSON.stringify(this.pristine.categories)) {
				payload.categories = structuredClone(this.draft.categories);
			}

			// Status são atômicos: qualquer diferença envia a lista completa.
			if (JSON.stringify(this.draft.statuses) !== JSON.stringify(this.pristine.statuses)) {
				payload.statuses = structuredClone(this.draft.statuses);
			}

			const result = await savePortalConfig(payload);

			if (result.ok) {
				this.pristine = structuredClone(result.data);
				this.draft = structuredClone(result.data);
				this.feedbackType = 'success';
				this.feedback = SAVE_SUCCESS_MESSAGE;
			} else {
				this.feedbackType = 'error';
				this.feedback = result.error.message;
			}
		} finally {
			this.saving = false;
		}
	}
}

export const settingsState = new SettingsState();
