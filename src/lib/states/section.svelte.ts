import type { Result } from '$lib/types/result';

// Estado de uma seção editável da tela de Configurações. Cada card cria a sua
// instância a partir de `page.data.portalConfig`: mantém `pristine` (o que está
// salvo) e `draft` (o que está em edição), calcula `dirty`, expõe o feedback e
// executa o save da sua própria rota PATCH. Não é um singleton de módulo — a
// instância vive no card.
export interface SectionFeedback {
	type: 'success' | 'error';
	message: string;
}

// Serialização canônica para comparar draft × pristine (objetos pequenos e
// planos, sem proxies).
function serialize(value: unknown): string {
	return JSON.stringify(value);
}

// `$state.snapshot` produz um clone plano — `structuredClone` direto sobre um
// proxy de `$state` lançaria `DataCloneError`.
function clone<T>(value: T): T {
	return structuredClone($state.snapshot(value)) as T;
}

// `persist` recebe o draft e o pristine: cada seção decide o payload (ex.:
// identidade envia só os campos alterados; tema/lcategorias enviam a seção
// inteira). Retorna a seção consolidada pelo backend.
export type SectionPersist<T> = (draft: T, pristine: T) => Promise<Result<T>>;

export class SectionState<T> {
	pristine = $state() as T;
	draft = $state() as T;
	saving = $state(false);
	feedback = $state<SectionFeedback | null>(null);

	#defaults: T;
	#persist: SectionPersist<T>;

	constructor(initial: T, defaults: T, persist: SectionPersist<T>) {
		this.pristine = clone(initial);
		this.draft = clone(initial);
		this.#defaults = clone(defaults);
		this.#persist = persist;
	}

	dirty: boolean = $derived(serialize(this.draft) !== serialize(this.pristine));

	clearFeedback(): void {
		this.feedback = null;
	}

	// Reverte o draft para o último estado salvo (Cancelar).
	reset(): void {
		this.draft = clone(this.pristine);
		this.clearFeedback();
	}

	// Reverte o draft para os valores padrão do portal (Restaurar padrão).
	restoreDefaults(): void {
		this.draft = clone(this.#defaults);
		this.clearFeedback();
	}

	// Salva a seção. Devolve `true` em sucesso — o card usa isso para limpar
	// estado local (ex.: arquivos pendentes de assets).
	async save(): Promise<boolean> {
		if (this.saving) return false;

		this.saving = true;
		this.clearFeedback();

		try {
			const result = await this.#persist(this.draft, this.pristine);

			if (result.ok) {
				this.pristine = clone(result.data);
				this.draft = clone(result.data);
				this.feedback = { type: 'success', message: 'Alterações salvas com sucesso.' };
				return true;
			}

			this.feedback = { type: 'error', message: result.error.message };
			return false;
		} finally {
			this.saving = false;
		}
	}
}
