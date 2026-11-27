import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QueueFilters from './QueueFilters.svelte';

const options = [{ value: 'all', label: 'Todos' }];

function renderFilters(isSearching = false) {
	const onSearch = vi.fn();
	const onClear = vi.fn();
	const onFilterChange = vi.fn();

	const { rerender } = render(QueueFilters, {
		props: {
			status: 'all',
			priority: 'all',
			assignee: 'all',
			department: 'all',
			dateFrom: '',
			dateTo: '',
			sortBy: 'createdAt',
			sortOrder: 'desc',
			statusOptions: options,
			priorityOptions: options,
			assigneeOptions: options,
			departmentOptions: options,
			sortByOptions: options,
			sortOrderOptions: options,
			onFilterChange,
			onClear,
			onSearch,
			isSearching
		}
	});

	return { onSearch, onClear, onFilterChange, rerender };
}

function searchInput() {
	return screen.getByRole('searchbox', {
		name: 'Buscar por título, conteúdo, protocolo, solicitante ou e-mail'
	});
}

describe('QueueFilters — estabilidade da busca', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('debounce envia apenas o último termo digitado após 300 ms', async () => {
		const { onSearch } = renderFilters();

		await fireEvent.input(searchInput(), { target: { value: 'Primeiro termo' } });
		await fireEvent.input(searchInput(), { target: { value: 'MAAT' } });

		expect(onSearch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(299);
		expect(onSearch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);

		expect(onSearch).toHaveBeenCalledTimes(1);
		expect(onSearch).toHaveBeenCalledWith('MAAT');
	});

	it('ação de buscar envia imediatamente e cancela o timer pendente', async () => {
		const { onSearch } = renderFilters();

		await fireEvent.input(searchInput(), { target: { value: 'Protocolo' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

		expect(onSearch).toHaveBeenCalledTimes(1);
		expect(onSearch).toHaveBeenCalledWith('Protocolo');
		await vi.advanceTimersByTimeAsync(300);
		expect(onSearch).toHaveBeenCalledTimes(1);
	});

	it('mantém o campo focado e habilitado durante a busca', async () => {
		const { rerender } = renderFilters();
		const input = searchInput();

		input.focus();
		expect(document.activeElement).toBe(input);

		await rerender({ isSearching: true });

		expect(screen.getByRole('search')).toHaveAttribute('aria-busy', 'true');
		expect(searchInput()).not.toBeDisabled();
		expect(document.activeElement).toBe(searchInput());
	});

	it('trocar um filtro cancela o debounce pendente da busca', async () => {
		const { onSearch, onFilterChange } = renderFilters();

		await fireEvent.input(searchInput(), { target: { value: 'Termo pendente' } });
		await fireEvent.change(screen.getByLabelText('Filtrar por data inicial'), {
			target: { value: '2026-01-01' }
		});

		expect(onFilterChange).toHaveBeenCalledTimes(1);
		expect(searchInput()).toHaveValue('');
		await vi.advanceTimersByTimeAsync(300);
		expect(onSearch).not.toHaveBeenCalled();
	});

	it('limpar filtros cancela a busca pendente', async () => {
		const { onSearch, onClear } = renderFilters();
		const input = searchInput();

		await fireEvent.input(input, { target: { value: 'Termo pendente' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

		expect(onClear).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(300);
		expect(onSearch).not.toHaveBeenCalled();
		expect(input).toHaveValue('');
	});
});
