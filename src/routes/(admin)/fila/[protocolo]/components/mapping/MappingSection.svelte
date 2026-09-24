<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { tick } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import UserMultiSelect from '$lib/components/UserMultiSelect.svelte';
	import { buildMappingPayload, getMapping, saveMapping } from '$lib/services/mapping.service';
	import { toastState } from '$lib/states/toast.svelte';
	import type { InternalRequestDetail } from '$lib/types/request';
	import type { AdminUser } from '$lib/types/user';
	import {
		MAPPING_DURATION_OPTIONS,
		MAPPING_LOCATION_MAXLENGTH,
		MAPPING_MODALITY_OPTIONS,
		MAPPING_NOTES_MAXLENGTH,
		type MappingDraft,
		type MappingResponse
	} from '$lib/types/mapping';
	import { formatDateTime } from '$lib/utils/dates';
	import { isValidEmail } from '$lib/utils/validations';
	import Field from '../solicitation-info/Field.svelte';
	import ToggleSection from '../solicitation-info/ToggleSection.svelte';
	import {
		applyMappingChange,
		emptyMappingDraft,
		isMappingConcluded,
		isMappingEmpty,
		modalityLabel,
		nowLocalMinute,
		toMappingDraft,
		validateMappingDraft,
		validateMappingField
	} from './mapping-validation';

	// Estrutura única para leitura e edição (mesmo padrão de `editarSolicitacao`):
	// quem tem permissão (`canEdit`) vê o formulário editável; os demais veem
	// os mesmos dados em somente leitura através do `Field` com `isEditMode`.
	// `canEdit` vem do primeiro GET da solicitação + `/auth/me` (via SpecTabs),
	// nunca do GET do mapeamento.
	interface Props {
		solicitation: InternalRequestDetail;
		canEdit: boolean;
	}

	let { solicitation, canEdit }: Props = $props();

	let protocol = $derived(solicitation.protocol);
	let editable = $derived(canEdit);

	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let saved = $state<MappingResponse | null>(null);
	let draft = $state<MappingDraft>(emptyMappingDraft());
	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);

	let isCreatingNew = $state(false);
	let saveError = $state<string | null>(null);
	let loadedProtocol = $state<string | null>(null);
	let formRoot = $state<HTMLElement | null>(null);
	// Participante externo (sem cadastro): a busca `/users` é só auxiliar de
	// preenchimento, nunca dependência para enviar um participante.
	let externalName = $state('');
	let externalEmail = $state('');
	let externalError = $state<string | null>(null);
	// `min` do datetime calculado só no cliente: evita divergência de SSR/hydration.
	// eslint-disable-next-line svelte/prefer-writable-derived -- "agora" não deriva de nenhum estado; só pode ser lido no cliente.
	let nowMin = $state('');

	let isEmpty = $derived(isMappingEmpty(saved));

	let isFinalized = $derived(
		!isLoading && Boolean(saved?.id) && !isCreatingNew && isMappingConcluded(solicitation.status)
	);
	
	let isFormEditable = $derived(editable && !isFinalized);
	let scheduledForDisplay = $derived(
		saved?.scheduledFor ? formatDateTime(saved.scheduledFor) : '---'
	);
	let modalityDisplay = $derived(modalityLabel(saved?.modality ?? null));
	let durationDisplay = $derived.by(() => {
		const duration = saved?.durationMinutes;
		if (duration === null || duration === undefined) return '---';
		return (
			MAPPING_DURATION_OPTIONS.find((option) => option.value === String(duration))?.label ??
			`${duration} minutos`
		);
	});
	let schedulePreferences = $derived(solicitation.schedulePreferences ?? []);

	$effect(() => {
		nowMin = nowLocalMinute();
	});

	function fallbackScheduledFor(): string | null {
		return solicitation.meeting?.scheduledFor ?? null;
	}

	function fallbackLink(): string | null {
		return solicitation.meeting?.link ?? null;
	}

	async function loadMapping(
		target: string,
		fallbackDate: string | null,
		fallbackMeetingLink: string | null
	): Promise<void> {
		isLoading = true;
		loadError = null;
		const result = await getMapping(target);
		if (result.ok) {
			saved = result.data;
			draft = toMappingDraft(result.data, fallbackDate, fallbackMeetingLink);
			errors = {};
			saveError = null;
		} else {
			loadError = result.error.message;
		}
		isLoading = false;
	}

	// Carrega uma vez por protocolo. `solicitation` (server load) é estável
	// durante a sessão da aba; o `meeting` do contrato serve só de fallback
	// inicial quando ainda não há agendamento salvo.
	$effect(() => {
		const target = protocol;
		const fallbackDate = fallbackScheduledFor();
		const fallbackMeetingLink = fallbackLink();
		if (loadedProtocol === target) return;
		loadedProtocol = target;
		isCreatingNew = false;
		void loadMapping(target, fallbackDate, fallbackMeetingLink);
	});

	function handleChange(
		path: 'scheduledFor' | 'durationMinutes' | 'meetingLink' | 'location' | 'notes',
		value: string
	): void {
		applyMappingChange(draft, path, value);
		delete errors[path];
	}

	function handleBlur(path: string): void {
		const next = validateMappingField(draft, path);
		delete errors[path];
		Object.assign(errors, next);
	}

	function handleModalityChange(value: string): void {
		draft.modality = value as MappingDraft['modality'];
		delete errors['modality'];
		// O campo oculto pela troca de modalidade não deve manter erro visível.
		if (value === 'REMOTE') delete errors['location'];
		if (value === 'IN_PERSON') delete errors['meetingLink'];
	}

	function isDuplicateEmail(email: string): boolean {
		const key = email.trim().toLowerCase();
		return draft.participants.some((participant) => participant.email.trim().toLowerCase() === key);
	}

	function handleSelectParticipant(user: AdminUser): void {
		// Duplicados barrados aqui e na busca (ids selecionados são excluídos).
		// Compara por id e por e-mail para cobrir externos já adicionados.
		if (
			draft.participants.some(
				(participant) =>
					(participant.id && participant.id === user.id) ||
					participant.email.trim().toLowerCase() === user.email.trim().toLowerCase()
			)
		) {
			return;
		}
		draft.participants = [
			...draft.participants,
			{ id: user.id, name: user.name, email: user.email }
		];
		delete errors['participants'];
	}

	function handleRemoveParticipant(key: string): void {
		const normalized = key.toLowerCase();
		draft.participants = draft.participants.filter(
			(participant) => (participant.id ?? participant.email).toLowerCase() !== normalized
		);
	}

	function handleAddExternal(): void {
		const name = externalName.trim();
		const email = externalEmail.trim();
		if (!name) {
			externalError = 'Informe o nome do participante.';
			return;
		}
		if (!email) {
			externalError = 'Informe o e-mail do participante.';
			return;
		}
		if (!isValidEmail(email)) {
			externalError = 'Informe um e-mail válido.';
			return;
		}
		if (isDuplicateEmail(email)) {
			externalError = 'Este participante já foi adicionado.';
			return;
		}
		draft.participants = [...draft.participants, { name, email }];
		externalName = '';
		externalEmail = '';
		externalError = null;
		delete errors['participants'];
	}

	function handleCancel(): void {
		isCreatingNew = false;
		draft = toMappingDraft(saved, fallbackScheduledFor(), fallbackLink());
		errors = {};
		saveError = null;
		externalName = '';
		externalEmail = '';
		externalError = null;
	}

	function handleStartNewMapping(): void {
		isCreatingNew = true;
		draft = toMappingDraft(null, fallbackScheduledFor(), fallbackLink());
		errors = {};
		saveError = null;
		externalName = '';
		externalEmail = '';
		externalError = null;
	}

	function focusFirstInvalid(): void {
		const target = formRoot?.querySelector<HTMLElement>('[aria-invalid="true"]');
		target?.focus();
	}

	// Envio único: concluir o mapeamento (`completeMapping: true`). O backend
	// valida, persiste e muda o status para "Mapeamento agendado" — o frontend
	// só reflete via `invalidateAll`.
	async function handleComplete(): Promise<void> {
		if (isSubmitting) return;
		const validation = validateMappingDraft(draft);
		errors = validation;
		if (Object.keys(validation).length > 0) {
			saveError = 'Revise os campos destacados antes de concluir o mapeamento.';
			tick().then(focusFirstInvalid);
			return;
		}
		isSubmitting = true;
		saveError = null;
		const result = await saveMapping(protocol, buildMappingPayload(draft));
		isSubmitting = false;
		if (result.ok) {
			saved = result.data;
			isCreatingNew = false;
			draft = toMappingDraft(result.data, fallbackScheduledFor(), fallbackLink());
			errors = {};
			externalName = '';
			externalEmail = '';
			externalError = null;
			toastState.add('Mapeamento concluído com sucesso.', 'success');
			// O backend alterou o status; recarrega os dados da página.
			await invalidateAll();
		} else {
			saveError = result.error.message;
		}
	}
</script>

<div class="mapping-section" bind:this={formRoot}>
	<h2 class="mapping-title">Mapeamento</h2>

	{#if isLoading}
		<div class="loading-state" aria-busy="true" aria-label="Carregando agendamento">
			<div class="skeleton line-skeleton"></div>
			<div class="skeleton card-skeleton"></div>
			<div class="skeleton card-skeleton"></div>
		</div>
	{:else if loadError}
		<div class="error-state" role="alert">
			<p>{loadError}</p>
			<button
				type="button"
				class="btn-retry"
				onclick={() => void loadMapping(protocol, fallbackScheduledFor(), fallbackLink())}
			>
				Tentar novamente
			</button>
		</div>
	{:else}
		<ToggleSection id="mapping-preferences" title="PREFERÊNCIAS DO SOLICITANTE" open={true}>
			{#if schedulePreferences.length > 0}
				<ul class="schedule-list">
					{#each schedulePreferences as preference (preference)}
						<li class="schedule-item">{formatDateTime(preference)}</li>
					{/each}
				</ul>
			{:else}
				<p class="fallback-text">Nenhuma preferência de horário informada.</p>
			{/if}
		</ToggleSection>

		<ToggleSection id="mapping-schedule" title="AGENDAMENTO DA REUNIÃO" open={true}>
			{#if !isFormEditable}
				<p class="readonly-notice">
					{#if !editable}
						Modo de visualização — seu perfil não permite editar o mapeamento.
					{:else}
						Mapeamento finalizado — os campos estão em somente leitura. Para um novo agendamento,
						use "Fazer novo mapeamento".
					{/if}
				</p>
			{:else if isCreatingNew}
				<p class="empty-notice">
					Novo mapeamento — o mapeamento anterior permanece registrado no histórico.
				</p>
			{:else if isEmpty}
				<p class="empty-notice">
					Nenhum agendamento registrado. Preencha os campos abaixo para agendar a reunião de
					mapeamento.
				</p>
			{/if}

			{#if saveError}
				<p class="save-feedback save-error" role="alert">{saveError}</p>
			{/if}

			<div class="grid">
				<Field
					label="Data e horário da reunião"
					value={scheduledForDisplay}
					isEditMode={isFormEditable}
					kind="datetime-local"
					required
					icon="calendarMonth"
					min={nowMin}
					editValue={draft.scheduledFor}
					error={errors['scheduledFor'] ?? ''}
					disabled={isSubmitting}
					onEditInput={(value) => handleChange('scheduledFor', value)}
					onEditBlur={() => handleBlur('scheduledFor')}
				/>
				<Field
					label="Duração prevista"
					value={durationDisplay}
					isEditMode={isFormEditable}
					kind="select"
					allowEmpty
					options={MAPPING_DURATION_OPTIONS}
					editValue={draft.durationMinutes}
					error={errors['durationMinutes'] ?? ''}
					disabled={isSubmitting}
					onEditInput={(value) => handleChange('durationMinutes', value)}
					onEditBlur={() => handleBlur('durationMinutes')}
				/>
			</div>

			<div class="grid">
				<div class="modality-block">
					{#if isFormEditable}
						<fieldset class="modality-fieldset">
							<legend>Modalidade de realização</legend>
							<div class="modality-options">
								{#each MAPPING_MODALITY_OPTIONS as option (option.value)}
									<label class="modality-option" class:selected={draft.modality === option.value}>
										<input
											type="radio"
											name="mapping-modality"
											value={option.value}
											checked={draft.modality === option.value}
											disabled={isSubmitting}
											aria-describedby={errors['modality'] ? 'mapping-modality-error' : undefined}
											onchange={() => handleModalityChange(option.value)}
										/>
										<span class="modality-pill" aria-hidden="true">{option.label}</span>
										<span class="sr-only">{option.label}</span>
									</label>
								{/each}
							</div>
							{#if errors['modality']}
								<p id="mapping-modality-error" class="field-error" role="alert">
									{errors['modality']}
								</p>
							{/if}
						</fieldset>
					{:else}
						<Field label="Modalidade de realização" value={modalityDisplay} />
					{/if}
				</div>

				<div class="location-block">
					{#if isFormEditable ? draft.modality === 'REMOTE' || !draft.modality : saved?.meetingLink}
						<Field
							label="Link da videoconferência"
							value={saved?.meetingLink}
							isEditMode={isFormEditable}
							kind="url"
							required={draft.modality === 'REMOTE'}
							placeholder="https://"
							icon="link"
							maxlength={500}
							editValue={draft.meetingLink}
							error={errors['meetingLink'] ?? ''}
							disabled={isSubmitting}
							onEditInput={(value) => handleChange('meetingLink', value)}
							onEditBlur={() => handleBlur('meetingLink')}
						/>
					{/if}

					{#if isFormEditable ? draft.modality === 'IN_PERSON' || !draft.modality : saved?.location}
						<Field
							label="Sala ou local presencial"
							value={saved?.location}
							isEditMode={isFormEditable}
							required={draft.modality === 'IN_PERSON'}
							placeholder="Ex.: Sala 3 — Bloco B"
							maxlength={MAPPING_LOCATION_MAXLENGTH}
							editValue={draft.location}
							error={errors['location'] ?? ''}
							disabled={isSubmitting}
							onEditInput={(value) => handleChange('location', value)}
							onEditBlur={() => handleBlur('location')}
						/>
					{/if}
				</div>
			</div>

			<div class="participants-block">
				<UserMultiSelect
					label="Participantes convocados"
					placeholder="Buscar por nome ou e-mail..."
					selected={draft.participants}
					onSelect={handleSelectParticipant}
					onRemove={handleRemoveParticipant}
					disabled={isSubmitting}
					readonly={!isFormEditable}
				>
					<div class="external-form">
						<p class="external-title">Adicionar participante externo</p>
						<div class="external-row">
							<label class="external-field">
								<span>Nome</span>
								<input
									type="text"
									placeholder="Nome completo"
									bind:value={externalName}
									disabled={isSubmitting}
									maxlength={120}
								/>
							</label>
							<label class="external-field">
								<span>E-mail</span>
								<input
									type="email"
									placeholder="nome@exemplo.com"
									bind:value={externalEmail}
									disabled={isSubmitting}
									maxlength={255}
								/>
							</label>
							<button
								type="button"
								class="btn-add-external"
								disabled={isSubmitting}
								onclick={handleAddExternal}
							>
								Adicionar
							</button>
						</div>
						{#if externalError}
							<p class="field-error" role="alert">{externalError}</p>
						{/if}
					</div>
				</UserMultiSelect>
				{#if errors['participants'] && isFormEditable}
					<p class="field-error" role="alert">{errors['participants']}</p>
				{/if}
			</div>

			<div class="notes-block">
				<Field
					label="Observações"
					value={saved?.notes}
					multiline
					isEditMode={isFormEditable}
					kind="textarea"
					rows={4}
					maxlength={MAPPING_NOTES_MAXLENGTH}
					editValue={draft.notes}
					error={errors['notes'] ?? ''}
					disabled={isSubmitting}
					onEditInput={(value) => handleChange('notes', value)}
					onEditBlur={() => handleBlur('notes')}
				/>
			</div>

			{#if isFormEditable}
				<div class="form-actions">
					<Button variant="outline-neutral" disabled={isSubmitting} onclick={handleCancel}>
						Cancelar
					</Button>
					<Button variant="primary" loading={isSubmitting} onclick={() => void handleComplete()}>
						Concluir mapeamento
					</Button>
				</div>
			{:else}
				{#if saved?.meetingLink}
					<p class="readonly-link-row">
						<a
							href={saved.meetingLink}
							target="_blank"
							rel="external noopener noreferrer"
							class="readonly-link"
						>
							Abrir link da videoconferência
						</a>
					</p>
				{/if}
				{#if isFinalized && editable}
					<div class="form-actions">
						<Button variant="primary" onclick={handleStartNewMapping}>
							<Icon iconName="addCircle" iconSize="sm" />
							Fazer novo mapeamento
						</Button>
					</div>
				{/if}
			{/if}
		</ToggleSection>
	{/if}
</div>

<style>
	.mapping-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.mapping-title {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--black);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md) var(--spacing-lg);
		margin-bottom: var(--spacing-md);
		align-items: start;
	}

	.readonly-notice,
	.empty-notice {
		margin: 0 0 var(--spacing-md) 0;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		line-height: 1.5;
	}

	.readonly-notice {
		background: var(--background-color);
		border: 1px solid var(--white-gray);
		color: var(--gray);
	}

	.empty-notice {
		background: var(--status-blue-bg);
		border: 1px solid var(--status-blue);
		color: var(--status-blue);
	}

	.save-feedback {
		margin: 0 0 var(--spacing-md) 0;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
	}

	.save-error {
		background-color: var(--status-red-bg);
		color: var(--status-red);
		border: 1px solid var(--status-red);
	}

	.modality-block,
	.location-block {
		min-width: 0;
	}

	.location-block {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.modality-fieldset {
		margin: 0;
		padding: 0;
		border: none;
	}

	.modality-fieldset legend {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray);
		letter-spacing: 0.03em;
		line-height: 1.5;
		padding: 0;
		margin-bottom: 8px;
	}

	.modality-options {
		display: inline-flex;
		gap: 4px;
		max-width: 100%;
		padding: 4px;
		flex-wrap: wrap;
		background: var(--background-color);
		border-radius: var(--radius-sm);
	}

	.modality-option {
		cursor: pointer;
	}

	.modality-option input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}

	.modality-pill {
		display: inline-flex;
		align-items: center;
		padding: 8px 18px;
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		background: transparent;
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--gray);
		transition:
			background 150ms ease,
			color 150ms ease,
			border-color 150ms ease;
	}

	.modality-option.selected .modality-pill {
		background: var(--white);
		border-color: var(--white-gray);
		color: var(--secondary-color);
	}

	.modality-option input:focus-visible + .modality-pill {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.modality-option input:disabled + .modality-pill {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.field-error {
		margin: 4px 0 0 0;
		color: var(--status-red);
		font-family: var(--font-inter);
		font-size: 12px;
	}

	.participants-block {
		margin-bottom: var(--spacing-md);
	}

	.external-form {
		padding: 12px;
		background: var(--white);
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.external-title {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--black);
	}

	.external-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.external-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 160px;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.external-field input {
		padding: 8px 10px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		background: var(--white);
	}

	.external-field input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.btn-add-external {
		padding: 8px 16px;
		border: 1px solid var(--secondary-color);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--secondary-color);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-add-external:hover:not(:disabled) {
		background: var(--secondary-color);
		color: var(--white);
	}

	.btn-add-external:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.fallback-text {
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--gray);
		margin: 0;
	}

	.schedule-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.schedule-item {
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--black);
	}

	.notes-block {
		margin-bottom: var(--spacing-md);
	}

	.form-actions {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.readonly-link-row {
		margin: 0;
	}

	.readonly-link {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--secondary-color);
		text-decoration: none;
	}

	.readonly-link:hover {
		text-decoration: underline;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.skeleton {
		background: linear-gradient(
			90deg,
			var(--white-gray) 25%,
			var(--white) 50%,
			var(--white-gray) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.line-skeleton {
		height: 20px;
		width: 40%;
	}

	.card-skeleton {
		height: 120px;
	}

	.error-state {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		text-align: center;
		box-shadow: var(--regular-shadow);
	}

	.error-state p {
		margin: 0 0 var(--spacing-md) 0;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--status-red);
	}

	.btn-retry {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		background: var(--primary-color);
		color: var(--white);
		border: none;
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-retry:hover {
		background: var(--secondary-color);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
			background: var(--white-gray);
		}

		.modality-pill {
			transition: none;
		}
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
