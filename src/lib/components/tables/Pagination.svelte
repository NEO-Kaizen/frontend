<script lang="ts">
	let {
		currentPage,
		totalPages,
		onpagechange
	}: {
		currentPage: number;
		totalPages: number;
		onpagechange: (page: number) => void;
	} = $props();

	function previousPage() {
		if (currentPage > 1) {
			onpagechange(currentPage - 1);
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			onpagechange(currentPage + 1);
		}
	}

	let visiblePages = $derived.by(() => {
		if (totalPages <= 0) {
			return [];
		}

		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		if (currentPage <= 3) {
			return [1, 2, 3, '...', totalPages];
		}

		if (currentPage >= totalPages - 2) {
			return [1, '...', totalPages - 2, totalPages - 1, totalPages];
		}

		return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
	});
</script>

<div class="pagination">
	<button
		type="button"
		class="arrow"
		onclick={previousPage}
		disabled={currentPage <= 1}
		aria-label="Página anterior"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M15 18l-6-6 6-6" />
		</svg>
	</button>

	{#each visiblePages as page, index (`${page}-${index}`)}
		{#if page === '...'}
			<span class="ellipsis">...</span>
		{:else}
			<button
				type="button"
				class="page-btn"
				class:active={currentPage === page}
				aria-current={currentPage === page ? 'page' : undefined}
				onclick={() => onpagechange(page as number)}
			>
				{page}
			</button>
		{/if}
	{/each}

	<button
		type="button"
		class="arrow"
		onclick={nextPage}
		disabled={currentPage >= totalPages || totalPages <= 0}
		aria-label="Próxima página"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M9 18l6-6-6-6" />
		</svg>
	</button>
</div>

<style>
	.pagination {
		display: flex;
		align-items: center;
		gap: 4px; /* Espaçamento mais enxuto igual à imagem */
	}

	.arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: var(--text-color-primary);
		cursor: pointer;
	}

	.arrow:disabled {
		color: #cbd5e1; /* Cor da seta inativa da imagem */
		cursor: not-allowed;
	}

	.arrow svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.page-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		height: 28px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--text-color-primary);
		font: var(--label);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		padding: 0 4px;
	}

	.page-btn.active {
		background: var(--secondary-color); /* Fundo azul */
		color: var(--on-primary);
	}

	.ellipsis {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		min-width: 24px;
		height: 28px;
		color: var(--gray);
		font-weight: 600;
		font-size: 14px;
		letter-spacing: 1px;
		padding-bottom: 4px;
	}
</style>
