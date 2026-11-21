<script lang="ts">
	// Imagem de asset com suporte a variante de tema (claro/escuro) e, para SVG,
	// renderização monocromática na cor primária do tema (`tint`). A troca de
	// variante é feita por CSS conforme `data-theme` (sem JS, sem mismatch de SSR).
	interface Props {
		lightSrc: string;
		darkSrc?: string;
		alt: string;
		// Quando true e a imagem for SVG, pinta a silhueta com var(--primary-color).
		tint?: boolean;
		// Sobrescreve a detecção de SVG (ex.: preview de upload via blob URL).
		svg?: boolean;
		width?: number | string;
		height?: number | string;
		class?: string;
	}

	let {
		lightSrc,
		darkSrc,
		alt,
		tint = false,
		svg,
		width,
		height,
		class: className = ''
	}: Props = $props();

	const SVG_PATTERN = /\.svg(\?.*)?$/i;
	const lightIsSvg = $derived(svg ?? SVG_PATTERN.test(lightSrc));
	const hasDark = $derived(Boolean(darkSrc) && darkSrc !== lightSrc);
	const tinted = $derived(tint && lightIsSvg);

	function size(value: number | string | undefined): string | undefined {
		if (value === undefined) return undefined;
		return typeof value === 'number' ? `${value}px` : value;
	}

	const widthStyle = $derived(size(width));
	const heightStyle = $derived(size(height));
</script>

{#if tinted}
	<span
		class="asset-image asset-tint {className}"
		role="img"
		aria-label={alt}
		style:width={widthStyle}
		style:height={heightStyle}
		style:--asset-mask={`url("${lightSrc}")`}
	></span>
{:else if hasDark}
	<img
		class="asset-image asset-light {className}"
		src={lightSrc}
		{alt}
		style:width={widthStyle}
		style:height={heightStyle}
	/>
	<img
		class="asset-image asset-dark {className}"
		src={darkSrc}
		alt=""
		aria-hidden="true"
		style:width={widthStyle}
		style:height={heightStyle}
	/>
{:else}
	<img
		class="asset-image {className}"
		src={lightSrc}
		{alt}
		style:width={widthStyle}
		style:height={heightStyle}
	/>
{/if}

<style>
	.asset-image {
		display: inline-block;
		object-fit: contain;
	}

	.asset-tint {
		background-color: var(--primary-color);
		-webkit-mask: var(--asset-mask) center / contain no-repeat;
		mask: var(--asset-mask) center / contain no-repeat;
	}

	.asset-dark {
		display: none;
	}

	:global([data-theme='dark']) .asset-light {
		display: none;
	}

	:global([data-theme='dark']) .asset-dark {
		display: inline-block;
	}
</style>
