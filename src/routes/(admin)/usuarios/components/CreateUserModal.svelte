<script lang="ts">
	import { page } from '$app/state';

	import Button from '$lib/components/Button.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { PortalCategory } from '$lib/types/portal-config';
	import type { CreateUserFormData, CreateUserResponse, UserProfile } from '$lib/types/user';
	import {
		isRequired,
		isValidEmail,
		isValidText,
		PROFILE_JOB_TITLE_MAX_LENGTH,
		PROFILE_NOTES_MAX_LENGTH,
		PROFILE_SPECIALTY_MAX_LENGTH
	} from '$lib/utils/validations';

	interface Props {
		loading?: boolean;
		error?: string;
		categories?: PortalCategory[];
		onclose: () => void;
		oncreate: (data: CreateUserFormData) => Promise<CreateUserResponse>;
	}

	let { loading = false, error = '', categories = [], onclose, oncreate }: Props = $props();

	const roleOptions: { value: UserProfile; label: string }[] = [
		{ value: 'solicitante', label: 'Solicitante' },
		{ value: 'analista', label: 'Analista' },
		{ value: 'gestor', label: 'Gestor' }
	];

	const roleLabels: Record<UserProfile, string> = {
		solicitante: 'Solicitante',
		analista: 'Analista',
		gestor: 'Gestor',
		administrador: 'Administrador'
	};

	let name = $state('');
	let email = $state('');
	let role = $state<UserProfile>('solicitante');

	// Bloco profissional — exigido pelo backend apenas para o perfil Analista.
	let jobTitle = $state('');
	let specialties = $state<string[]>([]);
	let attendedCategoryIds = $state<number[]>([]);
	let notes = $state('');

	let nameError = $state('');
	let emailError = $state('');
	let roleError = $state('');
	let jobTitleError = $state('');
	let specialtiesError = $state('');
	let categoriesError = $state('');
	let notesError = $state('');

	let temporaryPassword = $state('');
	let createdUserName = $state('');
	let createdUserRole = $state<UserProfile>('solicitante');

	function clearProfessionalErrors() {
		jobTitleError = '';
		specialtiesError = '';
		categoriesError = '';
		notesError = '';
	}

	function resetProfessional() {
		jobTitle = '';
		specialties = [];
		attendedCategoryIds = [];
		notes = '';
		clearProfessionalErrors();
	}

	function validateProfessional(): boolean {
		clearProfessionalErrors();

		const trimmedJobTitle = jobTitle.trim();

		if (!isRequired(trimmedJobTitle)) {
			jobTitleError = 'Informe o cargo.';
		} else if (trimmedJobTitle.length > PROFILE_JOB_TITLE_MAX_LENGTH) {
			jobTitleError = `Máximo de ${PROFILE_JOB_TITLE_MAX_LENGTH} caracteres.`;
		}

		if (specialties.length === 0) {
			specialtiesError = 'Informe ao menos uma especialidade.';
		} else if (specialties.some((item) => item.length > PROFILE_SPECIALTY_MAX_LENGTH)) {
			specialtiesError = `Cada especialidade deve ter no máximo ${PROFILE_SPECIALTY_MAX_LENGTH} caracteres.`;
		}

		if (attendedCategoryIds.length === 0) {
			categoriesError = 'Selecione ao menos uma categoria atendida.';
		}

		if (notes.trim().length > PROFILE_NOTES_MAX_LENGTH) {
			notesError = `Máximo de ${PROFILE_NOTES_MAX_LENGTH} caracteres.`;
		}

		return !jobTitleError && !specialtiesError && !categoriesError && !notesError;
	}

	function validate(): boolean {
		nameError = '';
		emailError = '';
		roleError = '';

		const trimmedName = name.trim();
		const trimmedEmail = email.trim();

		if (!isRequired(trimmedName)) {
			nameError = 'Informe o nome completo.';
		} else if (!isValidText(trimmedName)) {
			nameError = 'O nome deve conter apenas letras e espaços.';
		} else if (trimmedName.length > 150) {
			nameError = 'O nome deve ter no máximo 150 caracteres.';
		}

		if (!isRequired(trimmedEmail)) {
			emailError = 'Informe o e-mail.';
		} else if (!isValidEmail(trimmedEmail)) {
			emailError = 'Informe um e-mail válido.';
		} else if (trimmedEmail.length > 254) {
			emailError = 'O e-mail deve ter no máximo 254 caracteres.';
		}

		if (!isRequired(role)) {
			roleError = 'Selecione um perfil.';
		}

		const professionalValid = role === 'analista' ? validateProfessional() : true;

		return !nameError && !emailError && !roleError && professionalValid;
	}

	async function handleCreate() {
		if (loading || !validate()) {
			return;
		}

		try {
			const result = await oncreate({
				name: name.trim(),
				email: email.trim(),
				role,
				professional:
					role === 'analista'
						? {
								jobTitle: jobTitle.trim(),
								specialties,
								attendedCategoryIds,
								notes: notes.trim() || undefined
							}
						: undefined
			});

			createdUserName = result.fullName;
			createdUserRole = role;
			temporaryPassword = result.temporaryPassword;
		} catch {
			return;
		}
	}

	function handleRoleChange() {
		if (role !== 'analista') {
			resetProfessional();
		}
	}

	function toggleCategory(id: number) {
		attendedCategoryIds = attendedCategoryIds.includes(id)
			? attendedCategoryIds.filter((value) => value !== id)
			: [...attendedCategoryIds, id];
	}

	function handleClose() {
		name = '';
		email = '';
		role = 'solicitante';

		nameError = '';
		emailError = '';
		roleError = '';
		resetProfessional();

		temporaryPassword = '';
		createdUserName = '';
		createdUserRole = 'solicitante';

		onclose();
	}
</script>

<Modal
	title={temporaryPassword ? 'Usuário cadastrado' : 'Adicionar usuário'}
	size="lg"
	onclose={handleClose}
>
	{#if temporaryPassword}
		<div class="success-content">
			<p class="description">
				O {roleLabels[createdUserRole].toLowerCase()} foi cadastrado com sucesso.
			</p>

			<div class="success-box">
				<strong>{createdUserName}</strong>

				<p>Guarde a senha temporária abaixo. Ela será exibida somente nesta etapa.</p>
			</div>

			<div class="password-box">
				<span class="field-label">Senha temporária</span>

				<strong class="temporary-password">
					{temporaryPassword}
				</strong>

				<CopyButton text={temporaryPassword} />
			</div>

			<div class="modal-actions">
				<Button variant="primary" onclick={handleClose}>Concluir</Button>
			</div>
		</div>
	{:else}
		<div class="form-content">
			<div class="form-scroll">
				<p class="description">
					Cadastre um novo usuário no {page.data.portalConfig.platformName}.
				</p>

				<div class="field">
					<span class="field-label"
						>Nome completo<span class="required-mark" aria-hidden="true">*</span></span
					>

					<Input
						type="text"
						placeholder="Digite o nome completo"
						aria-label="Nome completo"
						bind:value={name}
					/>

					{#if nameError}
						<p class="field-error">
							{nameError}
						</p>
					{/if}
				</div>

				<div class="field">
					<span class="field-label"
						>E-mail<span class="required-mark" aria-hidden="true">*</span></span
					>

					<Input
						type="email"
						placeholder="Digite o e-mail"
						aria-label="E-mail"
						bind:value={email}
					/>

					{#if emailError}
						<p class="field-error">
							{emailError}
						</p>
					{/if}
				</div>

				<div class="form-row">
					<div class="field">
						<Select
							label="Perfil"
							options={roleOptions}
							bind:value={role}
							error={roleError}
							onchange={handleRoleChange}
						/>
					</div>

					<div class="field">
						<span class="field-label">Status</span>

						<div class="readonly-field">Ativo</div>
					</div>
				</div>

				{#if role === 'analista'}
					<section class="professional-section" aria-label="Dados profissionais do analista">
						<h3 class="section-title">Dados profissionais</h3>

						<Input
							label="Cargo"
							placeholder="Ex.: Analista de Processos"
							maxlength={PROFILE_JOB_TITLE_MAX_LENGTH}
							required
							bind:value={jobTitle}
							error={jobTitleError}
						/>

						<TagInput
							required
							label="Especialidades"
							hint="Pressione Enter ou use + para adicionar."
							placeholder="Ex.: Automação"
							maxlength={PROFILE_SPECIALTY_MAX_LENGTH}
							bind:value={specialties}
							error={specialtiesError}
						/>

						<fieldset class="categories">
							<legend
								>Formatos de demanda atendidos<span class="required-mark" aria-hidden="true">*</span
								></legend
							>

							<div class="category-options">
								{#each categories as category (category.id)}
									<label class="category-option">
										<input
											type="checkbox"
											checked={attendedCategoryIds.includes(category.id)}
											onchange={() => toggleCategory(category.id)}
										/>
										<span>{category.name}</span>
									</label>
								{/each}
							</div>

							{#if categoriesError}
								<p class="field-error" role="alert">{categoriesError}</p>
							{/if}
						</fieldset>

						<Textarea
							label="Observações"
							placeholder="Informações administrativas sobre o analista"
							maxlength={PROFILE_NOTES_MAX_LENGTH}
							bind:value={notes}
							error={notesError}
						/>
					</section>
				{/if}

				{#if error}
					<p class="form-error" role="alert">
						{error}
					</p>
				{/if}
			</div>

			<div class="modal-actions">
				<Button variant="outline-neutral" onclick={handleClose} disabled={loading}>Cancelar</Button>

				<Button variant="primary" onclick={handleCreate} {loading}>Cadastrar usuário</Button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.form-content,
	.success-content {
		display: flex;
		flex: 1;
		min-height: 0;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.success-content {
		overflow-y: auto;
	}

	.form-scroll {
		display: flex;
		flex: 1;
		min-height: 0;
		flex-direction: column;
		gap: var(--spacing-md);
		overflow-y: auto;
		padding-right: 4px;
	}

	.description {
		margin: 0;
		color: var(--gray);
		font: var(--paragrafo);
	}

	.field {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.field-label {
		font: var(--label);
		color: var(--black);
	}

	.required-mark {
		margin-left: 2px;
		color: var(--status-red);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
	}

	.professional-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}

	.section-title {
		margin: 0;
		font: var(--h4);
		color: var(--heading-color);
	}

	.categories {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin: 0;
		padding: 0;
		border: none;
	}

	.categories legend {
		padding: 0;
		font: var(--label);
		color: var(--black);
	}

	.category-options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-sm) var(--spacing-md);
	}

	.category-option {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font: var(--paragrafo);
		color: var(--black);
	}

	.category-option input {
		width: 16px;
		height: 16px;
		accent-color: var(--primary-color);
	}

	.readonly-field {
		min-height: 42px;
		display: flex;
		align-items: center;
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--background-color);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--gray);
		font: var(--paragrafo);
	}

	.field-error,
	.form-error {
		margin: 0;
		color: var(--status-red);
		font: var(--label);
		font-size: 12px;
	}

	.form-error {
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--status-red-bg);
		border-radius: var(--radius-sm);
	}

	.success-box {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background-color: var(--status-green-bg);
		border-radius: var(--radius-sm);
	}

	.success-box strong {
		color: var(--status-green);
		font: var(--h4);
	}

	.success-box p {
		margin: 0;
		color: var(--black);
		font: var(--paragrafo);
	}

	.password-box {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.temporary-password {
		padding: var(--spacing-md);
		background-color: var(--background-color);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--primary-color);
		font-family: monospace;
		font-size: 18px;
		letter-spacing: 1px;
		word-break: break-all;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.category-options {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}
	}
</style>
