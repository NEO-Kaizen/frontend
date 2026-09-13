import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import { savePortalConfig } from '$lib/config/portal-config.service';
import type {
	PortalConfig,
	SolicitationMode,
	UpdatePortalConfigPayload
} from '$lib/types/portal-config';
import { isValidPlatformName, isValidProtocolMask } from '$lib/utils/validations';

// `pristine` espelha o que está salvo no servidor; `draft` carrega os valores
// em edição na UI — assim dá para saber se houve mudança e reverter o rascunho.
export class SettingsState {
	pristine: PortalConfig = $state(structuredClone(DEFAULT_PORTAL_CONFIG));
	draft: PortalConfig = $state(structuredClone(DEFAULT_PORTAL_CONFIG));
	saving: boolean = $state(false);
	feedback: string | null = $state(null);
	feedbackType: 'success' | 'error' | null = $state(null);

	dirty: boolean = $derived(
		this.draft.platformName !== this.pristine.platformName ||
			this.draft.protocolMask !== this.pristine.protocolMask ||
			this.draft.solicitationMode !== this.pristine.solicitationMode
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

	hasValidationErrors: boolean = $derived(
		this.fieldErrors.platformName !== undefined || this.fieldErrors.protocolMask !== undefined
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

	reset(): void {
		this.draft = structuredClone(this.pristine);
		this.feedback = null;
		this.feedbackType = null;
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

			const result = await savePortalConfig(payload);

			if (result.ok) {
				this.pristine = structuredClone(result.data);
				this.draft = structuredClone(result.data);
				this.feedbackType = 'success';
				this.feedback = 'Configurações salvas com sucesso.';
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
