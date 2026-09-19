<script lang="ts">
	import Icon from './Icon.svelte';
	import type { DemandFile } from '$lib/types/request';
	import { ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from '$lib/types/request';

	interface Props {
		files?: DemandFile[];
		error?: string;
		disabled?: boolean;
		onchange?: () => void;
	}

	let { files = $bindable([]), error = '', disabled = false, onchange }: Props = $props();

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;
	let errorMessage = $state('');

	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	function validateFile(file: File): string | null {
		const extension = '.' + file.name.split('.').pop()?.toLowerCase();
		const typeValid = ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number]);
		const extensionValid = ALLOWED_FILE_EXTENSIONS.includes(
			extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]
		);

		if (!typeValid || !extensionValid) {
			return 'Tipo de arquivo não permitido. Use PDF, DOCX, XLSX, PNG ou JPG.';
		}

		if (file.size > MAX_FILE_SIZE) {
			return 'Arquivo excede o tamanho máximo de 10MB.';
		}

		return null;
	}

	function addFiles(newFiles: FileList | null) {
		if (!newFiles) return;

		errorMessage = '';

		for (const file of Array.from(newFiles)) {
			const validationError = validateFile(file);
			if (validationError) {
				errorMessage = validationError;
				continue;
			}

			files = [
				...files,
				{
					id: generateId(),
					fileName: file.name,
					mimeType: file.type,
					sizeBytes: file.size,
					file
				}
			];
		}

		onchange?.();
	}

	function removeFile(id: string) {
		files = files.filter((f) => f.id !== id);
		onchange?.();
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		addFiles(event.dataTransfer?.files ?? null);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function openFilePicker() {
		if (!disabled) {
			fileInput.click();
		}
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		addFiles(target.files);
		target.value = '';
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	let displayError = $derived(error || errorMessage);
</script>

<div class="file-upload">
	<div
		class="dropzone"
		class:dragging={isDragging}
		class:disabled
		class:error={Boolean(displayError)}
		role="button"
		tabindex={disabled ? -1 : 0}
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		onclick={openFilePicker}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openFilePicker();
			}
		}}
		aria-label="Área de upload de arquivos"
	>
		<input
			bind:this={fileInput}
			type="file"
			multiple
			accept=".pdf,.docx,.xlsx,.png,.jpg"
			onchange={handleFileChange}
			aria-hidden="true"
			tabindex="-1"
		/>

		<span class="upload-icon" aria-hidden="true">
			<Icon iconName="cloudUpload" iconSize="lg" />
		</span>
		<p class="upload-text">Clique para enviar ou arraste arquivos</p>
		<p class="upload-hint">PDF, DOCX, XLSX, PNG ou JPG (Máx. 10MB)</p>
	</div>

	{#if files.length > 0}
		<ul class="file-list">
			{#each files as file (file.id)}
				<li class="file-item">
					<div class="file-info">
						<Icon iconName="description" iconSize="sm" />
						<span class="file-name">{file.fileName}</span>
						<span class="file-size">{formatFileSize(file.sizeBytes)}</span>
					</div>
					<button
						type="button"
						class="remove-button"
						onclick={() => removeFile(file.id)}
						aria-label="Remover arquivo {file.fileName}"
						{disabled}
					>
						<Icon iconName="delete" iconSize="sm" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if displayError}
		<p class="error-message" role="alert">
			{displayError}
		</p>
	{/if}
</div>

<style>
	.file-upload {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xl);
		border: 2px dashed var(--white-gray);
		border-radius: var(--radius-md);
		background-color: var(--white);
		cursor: pointer;
		transition: var(--transition-default);
		text-align: center;
	}

	.dropzone:hover:not(.disabled) {
		border-color: var(--secondary-color);
		background-color: var(--tint);
	}

	.dropzone.dragging {
		border-color: var(--secondary-color);
		background-color: var(--tint);
	}

	.dropzone.error {
		border-color: var(--status-red);
	}

	.dropzone.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.dropzone:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	input[type='file'] {
		display: none;
	}

	.upload-icon {
		color: var(--secondary-color);
	}

	.upload-text {
		font: var(--label);
		color: var(--black);
	}

	.upload-hint {
		font: var(--paragrafo);
		color: var(--gray);
		font-size: 14px;
	}

	.file-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: 0;
		margin: 0;
	}

	.file-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-sm) var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		color: var(--black);
		min-width: 0;
	}

	.file-name {
		font: var(--paragrafo);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-size {
		font: var(--paragrafo);
		color: var(--gray);
		white-space: nowrap;
	}

	.remove-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		border: none;
		background: none;
		color: var(--gray);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition-default);
		flex-shrink: 0;
	}

	.remove-button:hover {
		color: var(--status-red);
		background-color: var(--status-red-bg);
	}

	.remove-button:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.error-message {
		margin: 0;
		color: var(--status-red);
		font: var(--label);
	}
</style>
