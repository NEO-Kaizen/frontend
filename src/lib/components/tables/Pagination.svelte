<script lang="ts">
	let {
		paginaAtual,
		totalPaginas,
		onpagechange
	}: {
		paginaAtual: number;
		totalPaginas: number;
		onpagechange: (page: number) => void;
	} = $props();

	function paginaAnterior() {
		if (paginaAtual > 1) {
			onpagechange(paginaAtual - 1);
		}
	}

	function proximaPagina() {
		if (paginaAtual < totalPaginas) {
			onpagechange(paginaAtual + 1);
		}
	}

	let paginasVisiveis = $derived.by(() => {
		if (totalPaginas <= 0) {
			return [];
		}

		if (totalPaginas <= 5) {
			return Array.from({ length: totalPaginas }, (_, i) => i + 1);
		}

		if (paginaAtual <= 3) {
			return [1, 2, 3, '...', totalPaginas];
		}

		if (paginaAtual >= totalPaginas - 2) {
			return [1, '...', totalPaginas - 2, totalPaginas - 1, totalPaginas];
		}

		return [1, '...', paginaAtual - 1, paginaAtual, paginaAtual + 1, '...', totalPaginas];
	});
</script>

<div class="pagination">
	<button
		type="button"
		class="arrow"
		onclick={paginaAnterior}
		disabled={paginaAtual === 1}
		aria-label="Página anterior"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M15 18l-6-6 6-6" />
		</svg>
	</button>

	{#each paginasVisiveis as page, index (`${page}-${index}`)}
		{#if page === '...'}
			<span class="ellipsis">...</span>
		{:else}
			<button
				type="button"
				class="page-btn"
				class:active={paginaAtual === page}
				onclick={() => onpagechange(page as number)}
			>
				{page}
			</button>
		{/if}
	{/each}

	<button
		type="button"
		class="arrow"
		onclick={proximaPagina}
		disabled={paginaAtual === totalPaginas}
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
		color: var(--rich-black);
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
		color: var(--rich-black);
		font: var(--label);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		padding: 0 4px;
	}

	.page-btn.active {
		background: var(--secondary-color); /* Fundo azul */
		color: var(--white);
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
