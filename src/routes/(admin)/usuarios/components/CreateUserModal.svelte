<script lang="ts">
	import { page } from '$app/state';

	import Button from '$lib/components/Button.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { PortalCategory } from '$lib/types/portal-config';
	import type { CreateUserFormData, CreateUserResponse, UserProfile } from '$lib/types/user';
	import {
		PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH,
		PROFILE_AREA_MAX_LENGTH,
		PROFILE_DEPARTMENT_MAX_LENGTH,
		PROFILE_JOB_TITLE_MAX_LENGTH,
		PROFILE_MANAGER_MAX_LENGTH,
		PROFILE_NOTES_MAX_LENGTH,
		PROFILE_SPECIALTY_MAX_LENGTH,
		isRequired,
		isValidEmail,
		isValidText
	} from '$lib/utils/validations';
	import ProfessionalFields from './ProfessionalFields.svelte';

	interface Props {
		loading?: boolean;
		error?: string;
		categories: PortalCategory[];
		onclose: () => void;
		oncreate: (data: CreateUserFormData) => Promise<CreateUserResponse>;
	}

	let { loading = false, error = '', categories, onclose, oncreate }: Props = $props();

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
	let area = $state('');
	let department = $state('');
	let manager = $state('');
	let additionalContact = $state('');
	let jobTitle = $state('');
	let specialties = $state<string[]>([]);
	let attendedCategoryIds = $state<number[]>([]);
	let professionalNotes = $state('');

	let nameError = $state('');
	let emailError = $state('');
	let roleError = $state('');
	let areaError = $state('');
	let departmentError = $state('');
	let managerError = $state('');
	let additionalContactError = $state('');
	let jobTitleError = $state('');
	let specialtiesError = $state('');
	let categoriesError = $state('');
	let professionalNotesError = $state('');

	let temporaryPassword = $state('');
	let createdUserName = $state('');
	let createdUserRole = $state<UserProfile>('solicitante');

	function validate(): boolean {
		nameError = '';
		emailError = '';
		roleError = '';
		areaError = '';
		departmentError = '';
		managerError = '';
		additionalContactError = '';
		jobTitleError = '';
		specialtiesError = '';
		categoriesError = '';
		professionalNotesError = '';

		const trimmedName = name.trim();
		const trimmedEmail = email.trim();
		const trimmedArea = area.trim();
		const trimmedDepartment = department.trim();
		const trimmedManager = manager.trim();
		const trimmedContact = additionalContact.trim();

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

		if (!isRequired(trimmedArea)) {
			areaError = 'Informe a área do solicitante.';
		} else if (!isValidText(trimmedArea)) {
			areaError = 'A área deve conter apenas letras e espaços.';
		} else if (trimmedArea.length > PROFILE_AREA_MAX_LENGTH) {
			areaError = `A área deve ter no máximo ${PROFILE_AREA_MAX_LENGTH} caracteres.`;
		}

		if (trimmedDepartment && !isValidText(trimmedDepartment)) {
			departmentError = 'O departamento deve conter apenas letras e espaços.';
		} else if (trimmedDepartment.length > PROFILE_DEPARTMENT_MAX_LENGTH) {
			departmentError = `O departamento deve ter no máximo ${PROFILE_DEPARTMENT_MAX_LENGTH} caracteres.`;
		}

		if (!isRequired(trimmedManager)) {
			managerError = 'Informe o gestor responsável.';
		} else if (!isValidText(trimmedManager)) {
			managerError = 'O gestor deve conter apenas letras e espaços.';
		} else if (trimmedManager.length > PROFILE_MANAGER_MAX_LENGTH) {
			managerError = `O gestor deve ter no máximo ${PROFILE_MANAGER_MAX_LENGTH} caracteres.`;
		}

		if (trimmedContact) {
			if (trimmedContact.length < 3) {
				additionalContactError = 'Informe um contato válido.';
			} else if (trimmedContact.length > PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH) {
				additionalContactError = `O contato deve ter no máximo ${PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH} caracteres.`;
			}
		}

		if (role === 'analista') {
			const trimmedJobTitle = jobTitle.trim();
			if (!isRequired(trimmedJobTitle)) {
				jobTitleError = 'Informe o cargo do analista.';
			} else if (trimmedJobTitle.length > PROFILE_JOB_TITLE_MAX_LENGTH) {
				jobTitleError = `O cargo deve ter no máximo ${PROFILE_JOB_TITLE_MAX_LENGTH} caracteres.`;
			}

			if (specialties.length === 0) {
				specialtiesError = 'Informe ao menos uma especialidade.';
			} else if (specialties.some((item) => item.length > PROFILE_SPECIALTY_MAX_LENGTH)) {
				specialtiesError = `Cada especialidade deve ter no máximo ${PROFILE_SPECIALTY_MAX_LENGTH} caracteres.`;
			}

			if (attendedCategoryIds.length === 0) {
				categoriesError = 'Selecione ao menos uma categoria atendida.';
			}

			if (professionalNotes.length > PROFILE_NOTES_MAX_LENGTH) {
				professionalNotesError = `As observações devem ter no máximo ${PROFILE_NOTES_MAX_LENGTH} caracteres.`;
			}
		}

		return (
			!nameError &&
			!emailError &&
			!roleError &&
			!areaError &&
			!departmentError &&
			!managerError &&
			!additionalContactError &&
			!jobTitleError &&
			!specialtiesError &&
			!categoriesError &&
			!professionalNotesError
		);
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
				area: area.trim(),
				department: department.trim() || undefined,
				manager: manager.trim(),
				additionalContact: additionalContact.trim() || undefined,
				professional:
					role === 'analista'
						? {
								jobTitle: jobTitle.trim(),
								specialties: specialties.map((item) => item.trim()),
								attendedCategoryIds,
								notes: professionalNotes.trim() || undefined
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

	function handleClose() {
		name = '';
		email = '';
		role = 'solicitante';
		area = '';
		department = '';
		manager = '';
		additionalContact = '';
		jobTitle = '';
		specialties = [];
		attendedCategoryIds = [];
		professionalNotes = '';

		nameError = '';
		emailError = '';
		roleError = '';
		areaError = '';
		departmentError = '';
		managerError = '';
		additionalContactError = '';
		jobTitleError = '';
		specialtiesError = '';
		categoriesError = '';
		professionalNotesError = '';

		temporaryPassword = '';
		createdUserName = '';
		createdUserRole = 'solicitante';

		onclose();
	}
</script>

<Modal
	title={temporaryPassword ? 'Usuário cadastrado' : 'Adicionar usuário'}
	onclose={handleClose}
	size="lg"
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
			<p class="description">Cadastre um novo usuário no {page.data.portalConfig.platformName}.</p>

			<div class="field">
				<span class="field-label">Nome completo</span>

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
				<span class="field-label">E-mail</span>

				<Input type="email" placeholder="Digite o e-mail" aria-label="E-mail" bind:value={email} />

				{#if emailError}
					<p class="field-error">
						{emailError}
					</p>
				{/if}
			</div>

			<div class="form-row">
				<div class="field">
					<Select label="Perfil" options={roleOptions} bind:value={role} error={roleError} />
				</div>

				<div class="field">
					<span class="field-label">Status</span>

					<div class="readonly-field">Ativo</div>
				</div>
			</div>

			{#if role === 'analista'}
				<ProfessionalFields
					categories={categories.filter((category) => category.isActive)}
					bind:jobTitle
					bind:specialties
					bind:attendedCategoryIds
					bind:notes={professionalNotes}
					{jobTitleError}
					{specialtiesError}
					{categoriesError}
					notesError={professionalNotesError}
					disabled={loading}
				/>
			{/if}

			<div class="field">
				<span class="field-label">Área do solicitante *</span>

				<Input
					type="text"
					placeholder="Ex.: Operações"
					aria-label="Área do solicitante"
					bind:value={area}
					maxlength={PROFILE_AREA_MAX_LENGTH}
				/>

				{#if areaError}
					<p class="field-error">
						{areaError}
					</p>
				{/if}
			</div>

			<div class="field">
				<span class="field-label">Departamento</span>

				<Input
					type="text"
					placeholder="Ex.: Atendimento"
					aria-label="Departamento"
					bind:value={department}
					maxlength={PROFILE_DEPARTMENT_MAX_LENGTH}
				/>

				{#if departmentError}
					<p class="field-error">
						{departmentError}
					</p>
				{/if}
			</div>

			<div class="field">
				<span class="field-label">Gestor responsável *</span>

				<Input
					type="text"
					placeholder="Nome do gestor responsável"
					aria-label="Gestor responsável"
					bind:value={manager}
					maxlength={PROFILE_MANAGER_MAX_LENGTH}
				/>

				{#if managerError}
					<p class="field-error">
						{managerError}
					</p>
				{/if}
			</div>

			<div class="field">
				<span class="field-label">Contato adicional</span>

				<Input
					type="text"
					placeholder="Ex.: ramal ou telefone"
					aria-label="Contato adicional"
					bind:value={additionalContact}
					maxlength={PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH}
				/>

				{#if additionalContactError}
					<p class="field-error">
						{additionalContactError}
					</p>
				{/if}
			</div>

			{#if error}
				<p class="form-error" role="alert">
					{error}
				</p>
			{/if}

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
		flex-direction: column;
		gap: var(--spacing-md);
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

	.form-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
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
		margin-top: var(--spacing-md);
	}

	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}
	}
</style>
