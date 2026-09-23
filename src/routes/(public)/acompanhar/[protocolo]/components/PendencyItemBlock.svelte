<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import PendencyFieldDiff from '$lib/components/PendencyFieldDiff.svelte';
	import Select from '$lib/components/Select.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import {
		getFieldEnumOptions,
		getFieldInputKind,
		parseFieldInput,
		parseYesNoInput,
		toFieldDraft,
		formatFieldValue,
		type RequesterFieldKind
	} from '$lib/pendency/requester-field-kind';
	import {
		MAX_OBSERVATION_RESPONSE_LENGTH,
		respondPendingItemAsRequester
	} from '$lib/services/pendency.service';
	import { toastState } from '$lib/states/toast.svelte';
	import type { PendingItem, RespondPendingItemBody } from '$lib/types/pendency';
	import type { RequesterIdentity } from '$lib/types/requester-tracking';
	import { formatDateTime } from '$lib/utils/dates';

	interface Props {
		protocol: string;
		item: PendingItem;
		identity: RequesterIdentity | null;
		/** `false` quando o card já exibe o comentário (observação do lote). */
		showComment?: boolean;
		/**
		 * Entrega o item atualizado (resposta do PATCH) para o card/lista
		 * aplicarem no estado local sem recarregar a página. Sem item
		 * (`undefined`) quando a UI precisa revalidar (ex.: 409).
		 */
		onResponded: (updated?: PendingItem) => void;
		onUnauthorized: () => void;
	}

	let {
		protocol,
		item,
		identity,
		showComment = true,
		onResponded,
		onUnauthorized
	}: Props = $props();

	const kind = $derived<RequesterFieldKind>(
		item.type === 'observation' ? 'textarea' : getFieldInputKind(item.field?.fieldKey ?? '')
	);
	const enumOptions = $derived(getFieldEnumOptions(kind));

	// Rascunho local por item: texto do input (`yesno` usa `yesNoChoice` +
	// `yesNoDetail`). Sincronizado com o item via `$effect` (abaixo): a
	// reabertura (`requested` de novo) chega com `correctedValue`/`responseText`
	// limpos pelo backend e o rascunho acompanha.
	let draft = $state('');
	let yesNoChoice = $state<'' | 'yes' | 'no'>('');
	let yesNoDetail = $state('');
	let draftKey = $state('');
	let fieldError = $state<string | null>(null);
	let isSending = $state(false);

	$effect(() => {
		const key = `${item.id}:${item.status}:${item.respondedAt ?? ''}`;
		if (key === draftKey) return;
		draftKey = key;
		draft = toFieldDraft(item.type === 'observation' ? item.responseText : item.correctedValue);
		yesNoChoice =
			typeof item.correctedValue === 'boolean' ? (item.correctedValue ? 'yes' : 'no') : '';
		yesNoDetail = typeof item.correctedValue === 'string' ? item.correctedValue : '';
		fieldError = null;
	});

	const isRequested = $derived(item.status === 'requested');
	const canConfirm = $derived.by(() => {
		if (!isRequested || isSending) return false;
		if (kind === 'yesno') return yesNoChoice !== '';
		return draft.trim() !== '';
	});

	function buildBody(): RespondPendingItemBody | null {
		if (item.type === 'observation') {
			const trimmed = draft.trim();
			if (!trimmed) {
				fieldError = 'Descreva a resposta antes de enviar.';
				return null;
			}
			if (trimmed.length > MAX_OBSERVATION_RESPONSE_LENGTH) {
				fieldError = `A resposta deve ter no máximo ${MAX_OBSERVATION_RESPONSE_LENGTH} caracteres.`;
				return null;
			}
			return { response: trimmed };
		}

		if (kind === 'yesno') {
			const parsed = parseYesNoInput(yesNoChoice, yesNoDetail);
			if (!parsed.ok) {
				fieldError = parsed.error ?? 'Informe o valor corrigido.';
				return null;
			}
			return { correctedValue: parsed.value ?? false };
		}

		const parsed = parseFieldInput(kind, draft);
		if (!parsed.ok) {
			fieldError = parsed.error ?? 'Informe o valor corrigido.';
			return null;
		}
		return { correctedValue: parsed.value ?? null };
	}

	async function handleConfirm(): Promise<void> {
		if (isSending || !isRequested) return;
		fieldError = null;
		const body = buildBody();
		if (!body) return;

		isSending = true;
		const result = await respondPendingItemAsRequester(protocol, item, body, identity);
		isSending = false;

		if (!result.ok) {
			// 401: identidade pública ausente/divergente/expirada — volta para a
			// validação com mensagem genérica (sem revelar o motivo).
			if (result.error.status === 401) {
				onUnauthorized();
				return;
			}
			// 409: outro estado real no backend — pede revalidação em vez de
			// deixar a UI inconsistente (sem desmontar a página).
			if (result.error.status === 409) {
				toastState.add(result.error.message, 'error');
				onResponded();
				return;
			}
			fieldError = result.error.message;
			toastState.add(result.error.message, 'error');
			return;
		}

		toastState.add('Resposta enviada com sucesso.', 'success');
		onResponded(result.data);
	}

	function handleInput(): void {
		fieldError = null;
	}
</script>

<div class="item-block" data-status={item.status}>
	{#if item.type === 'field_edit' && item.field}
		<div class="item-head">
			<span class="field-label">{item.field.fieldLabel}</span>
			{#if item.status === 'validated'}
				<span class="pill pill-validated">Validado</span>
			{:else if item.status === 'responded'}
				<span class="pill pill-responded">Respondido</span>
			{:else}
				<span class="pill pill-requested">Aguardando resposta</span>
			{/if}
		</div>
		{#if showComment && item.comment}
			<p class="analyst-comment">{item.comment}</p>
		{/if}

		{#if isRequested}
			<p class="current-value">
				Valor atual: <strong>{formatFieldValue(item.field.currentValue)}</strong>
			</p>
			<div class="response-form">
				{#if kind === 'yesno'}
					<Select
						label="Valor corrigido"
						placeholder="Selecione"
						bind:value={yesNoChoice}
						options={[
							{ value: 'no', label: 'Não' },
							{ value: 'yes', label: 'Sim' }
						]}
						disabled={isSending}
					/>
					{#if yesNoChoice === 'yes'}
						<Input
							label="Detalhamento (opcional)"
							placeholder="Descreva, se necessário"
							bind:value={yesNoDetail}
							disabled={isSending}
							maxlength={500}
						/>
					{/if}
				{:else if kind === 'textarea'}
					<Textarea
						label="Valor corrigido"
						placeholder="Informe o valor corrigido"
						bind:value={draft}
						disabled={isSending}
						maxlength={2000}
						oninput={handleInput}
					/>
				{:else if enumOptions}
					<Select
						label="Valor corrigido"
						placeholder="Selecione"
						bind:value={draft}
						options={enumOptions}
						disabled={isSending}
					/>
				{:else if kind === 'number'}
					<Input
						type="number"
						label="Valor corrigido"
						placeholder="Informe o valor corrigido"
						bind:value={draft}
						disabled={isSending}
					/>
				{:else if kind === 'date'}
					<Input type="date" label="Valor corrigido" bind:value={draft} disabled={isSending} />
				{:else}
					<Input
						type="text"
						label="Valor corrigido"
						placeholder="Informe o valor corrigido"
						bind:value={draft}
						disabled={isSending}
						maxlength={500}
					/>
				{/if}
				{#if fieldError}
					<p class="field-error" role="alert">{fieldError}</p>
				{/if}
				<div class="confirm-row">
					<Button loading={isSending} disabled={!canConfirm} onclick={handleConfirm}>
						{isSending ? 'Enviando…' : 'Confirmar'}
					</Button>
				</div>
			</div>
		{:else}
			<PendencyFieldDiff
				oldValue={formatFieldValue(item.field.currentValue)}
				newValue={formatFieldValue(item.correctedValue)}
				label={item.field.fieldLabel}
			/>
			{#if item.respondedAt}
				<span class="item-date">Respondida em {formatDateTime(item.respondedAt)}</span>
			{/if}
			{#if item.status === 'validated'}
				<p class="await-note validated-note">
					✓ Validado em {formatDateTime(item.validatedAt ?? item.respondedAt ?? item.createdAt)}
				</p>
			{:else}
				<p class="await-note">Aguardando validação do analista.</p>
			{/if}
		{/if}
	{:else}
		<div class="item-head">
			<span class="field-label">Observação do analista</span>
			{#if item.status === 'validated'}
				<span class="pill pill-validated">Validado</span>
			{:else if item.status === 'responded'}
				<span class="pill pill-responded">Respondido</span>
			{:else}
				<span class="pill pill-requested">Aguardando resposta</span>
			{/if}
		</div>
		{#if showComment && item.comment}
			<p class="analyst-comment">{item.comment}</p>
		{/if}

		{#if isRequested}
			<div class="response-form">
				<Textarea
					label="Sua resposta"
					placeholder="Descreva a informação solicitada"
					bind:value={draft}
					disabled={isSending}
					maxlength={MAX_OBSERVATION_RESPONSE_LENGTH}
					oninput={handleInput}
				/>
				{#if fieldError}
					<p class="field-error" role="alert">{fieldError}</p>
				{/if}
				<div class="confirm-row">
					<Button loading={isSending} disabled={!canConfirm} onclick={handleConfirm}>
						{isSending ? 'Enviando…' : 'Confirmar'}
					</Button>
				</div>
			</div>
		{:else}
			<p class="sent-value">
				Sua resposta: <strong>{item.responseText ?? '---'}</strong>
				{#if item.respondedAt}
					<span class="sent-at">· {formatDateTime(item.respondedAt)}</span>
				{/if}
			</p>
			{#if item.status === 'validated'}
				<p class="await-note validated-note">
					✓ Validado em {formatDateTime(item.validatedAt ?? item.respondedAt ?? item.createdAt)}
				</p>
			{:else}
				<p class="await-note">Aguardando validação do analista.</p>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.item-block {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
	}

	.item-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}

	.field-label {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		color: var(--black);
	}

	.pill {
		padding: 3px 10px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		white-space: nowrap;
	}

	.pill-requested {
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
	}

	.pill-responded {
		background: var(--tint);
		color: var(--secondary-color);
	}

	.pill-validated {
		background: var(--status-green-bg);
		color: var(--status-green);
	}

	.analyst-comment {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.current-value {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--gray);
	}

	.current-value strong {
		color: var(--black);
	}

	.item-date {
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
	}

	.response-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.field-error {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--status-red);
	}

	.confirm-row {
		display: flex;
		justify-content: flex-end;
	}

	.sent-value {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		white-space: pre-wrap;
	}

	.sent-at {
		color: var(--gray);
		font-weight: 400;
	}

	.await-note {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
		font-style: italic;
	}

	.validated-note {
		color: var(--status-green);
		font-style: normal;
		font-weight: 600;
	}
</style>
