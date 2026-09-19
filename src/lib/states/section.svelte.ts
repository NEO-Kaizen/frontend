import type { Result } from '$lib/types/result';

// Estado de uma seção editável da tela de Configurações. Cada card cria a sua
// instância a partir de `page.data.portalConfig`: mantém `pristine` (o que está
// salvo) e `draft` (o que está em edição), calcula `dirty`/`restorable` e
// executa o save da sua própria rota PATCH. Não é um singleton de módulo — a
// instância vive no card.
//
// O feedback de salvar (sucesso/erro) não vive aqui: `save()` devolve o
// resultado e o card publica no Toast global (`notifySectionSave`). Erros de
// campo continuam inline no próprio campo.
export type SaveOutcome = { ok: true } | { ok: false; message: string };

// Serialização canônica para comparar draft × pristine/defaults. Depende da
// ordem das chaves: os defaults (`portal-defaults`) e o objeto sanitizado
// (`portal-config.service`) precisam manter a mesma ordem de campos.
function serialize(value: unknown): string {
	return JSON.stringify(value);
}

// `$state.snapshot` produz um clone plano — `structuredClone` direto sobre um
// proxy de `$state` lançaria `DataCloneError`.
function clone<T>(value: T): T {
	return structuredClone($state.snapshot(value)) as T;
}

// `persist` recebe o draft e o pristine: cada seção decide o payload (ex.:
// identidade envia só os campos alterados; tema/categorias enviam a seção
// inteira). Retorna a seção consolidada pelo backend.
export type SectionPersist<T> = (draft: T, pristine: T) => Promise<Result<T>>;

export class SectionState<T> {
	pristine = $state() as T;
	draft = $state() as T;
	saving = $state(false);

	#defaults: T;
	#persist: SectionPersist<T>;

	constructor(initial: T, defaults: T, persist: SectionPersist<T>) {
		this.pristine = clone(initial);
		this.draft = clone(initial);
		this.#defaults = clone(defaults);
		this.#persist = persist;
	}

	dirty: boolean = $derived(serialize(this.draft) !== serialize(this.pristine));

	// Pode voltar aos padrões? Habilita "Restaurar padrão" quando o rascunho
	// diverge dos padrões (draft!=defaults) — mesmo antes de salvar — ou quando
	// o que já está salvo diverge (pristine!=defaults) mesmo sem alteração
	// local. Getter (e não `$derived`) porque `#defaults` só é atribuído no
	// construtor.
	get restorable(): boolean {
		return (
			serialize(this.pristine) !== serialize(this.#defaults) ||
			serialize(this.draft) !== serialize(this.#defaults)
		);
	}

	// Reverte o draft para o último estado salvo (Cancelar).
	reset(): void {
		this.draft = clone(this.pristine);
	}

	// Reverte o draft para os valores padrão do portal (Restaurar padrão).
	restoreDefaults(): void {
		this.draft = clone(this.#defaults);
	}

	// Salva a seção. Devolve `{ ok: true }` em sucesso — o card usa isso para
	// limpar estado local (ex.: arquivos pendentes de assets) e para o Toast.
	async save(): Promise<SaveOutcome> {
		if (this.saving) return { ok: false, message: 'Aguarde o salvamento em andamento.' };

		this.saving = true;

		try {
			const result = await this.#persist(this.draft, this.pristine);

			if (result.ok) {
				this.pristine = clone(result.data);
				this.draft = clone(result.data);
				return { ok: true };
			}

			return { ok: false, message: result.error.message };
		} finally {
			this.saving = false;
		}
	}
}
