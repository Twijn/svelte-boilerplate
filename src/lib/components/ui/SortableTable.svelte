<script lang="ts" generics="T">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
	import { fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Snippet } from 'svelte';
	import type { Column, BulkAction } from './SortableTable.types';
	import Button from './Button.svelte';

	interface Props {
		data: T[];
		columns: Column<T>[];
		rowKey: (item: T) => string | number;
		rowClass?: (item: T) => string;
		cellContent: Snippet<[{ item: T; column: Column<T> }]>;
		// Bulk actions
		enableBulkActions?: boolean;
		bulkActions?: BulkAction<T>[];
		onSelectionChange?: (selectedItems: T[]) => void;
	}

	let {
		data,
		columns,
		rowKey,
		rowClass,
		cellContent,
		enableBulkActions = false,
		bulkActions = [],
		onSelectionChange
	}: Props = $props();

	// Internal selection state
	let selectedItems = $state<T[]>([]);

	type SortDirection = 'asc' | 'desc' | null;

	let sortColumn = $state<keyof T | null>(null);
	let sortDirection = $state<SortDirection>(null);
	let isSorting = $state(false);

	// Selection state
	let allSelected = $derived(
		enableBulkActions && data.length > 0 && selectedItems.length === data.length
	);
	let someSelected = $derived(
		enableBulkActions && selectedItems.length > 0 && selectedItems.length < data.length
	);

	// Sort the data reactively
	const sortedData = $derived.by(() => {
		if (!sortColumn || !sortDirection) {
			return data;
		}

		const column = columns.find((col) => col.key === sortColumn);
		if (!column) return data;

		const sorted = [...data].sort((a, b) => {
			// Use custom sort value extractor if provided
			const aVal = column.sortValue ? column.sortValue(a) : a[sortColumn as keyof T];
			const bVal = column.sortValue ? column.sortValue(b) : b[sortColumn as keyof T];

			// Handle null/undefined
			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return 1;
			if (bVal == null) return -1;

			// Handle different types
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return aVal.localeCompare(bVal, undefined, { numeric: true });
			}

			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return aVal - bVal;
			}

			if (aVal instanceof Date && bVal instanceof Date) {
				return aVal.getTime() - bVal.getTime();
			}

			if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
				return aVal === bVal ? 0 : aVal ? -1 : 1;
			}

			// Fallback: convert to string and compare
			return String(aVal).localeCompare(String(bVal));
		});

		return sortDirection === 'desc' ? sorted.reverse() : sorted;
	});

	function handleSort(column: Column<T>) {
		if (column.sortable === false) return;

		isSorting = true;
		setTimeout(() => (isSorting = false), 300);

		if (sortColumn === column.key) {
			// Cycle through: asc -> desc -> null
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else if (sortDirection === 'desc') {
				sortDirection = null;
				sortColumn = null;
			}
		} else {
			sortColumn = column.key;
			sortDirection = 'asc';
		}
	}

	function getSortIcon(column: Column<T>) {
		if (column.sortable === false) return null;

		if (sortColumn !== column.key) {
			return faSort;
		}

		return sortDirection === 'asc' ? faSortUp : faSortDown;
	}

	// Selection functions
	function toggleSelectAll() {
		if (allSelected) {
			selectedItems = [];
		} else {
			selectedItems = [...data];
		}
		onSelectionChange?.(selectedItems);
	}

	function toggleSelectItem(item: T) {
		const key = rowKey(item);
		const index = selectedItems.findIndex((i) => rowKey(i) === key);

		if (index >= 0) {
			selectedItems = selectedItems.filter((_, i) => i !== index);
		} else {
			selectedItems = [...selectedItems, item];
		}
		onSelectionChange?.(selectedItems);
	}

	function isSelected(item: T): boolean {
		const key = rowKey(item);
		return selectedItems.some((i) => rowKey(i) === key);
	}

	function clearSelection() {
		selectedItems = [];
		onSelectionChange?.(selectedItems);
	}

	async function handleBulkAction(action: BulkAction<T>) {
		await action.onClick(selectedItems);
		// Clear selection after action completes
		clearSelection();
		return false;
	}
</script>

{#if enableBulkActions && selectedItems.length > 0}
	<div class="bulk-action-bar col-12" transition:slide={{ duration: 200 }}>
		<div class="bulk-info">
			<span class="selected-count">{selectedItems.length}</span>
			<span class="selected-text">
				{selectedItems.length === 1 ? 'item' : 'items'} selected
			</span>
			<button class="clear-selection" onclick={clearSelection}> Clear </button>
		</div>
		<div class="bulk-actions">
			{#each bulkActions as action (action.id)}
				<Button type="button" variant={action.variant} onClick={() => handleBulkAction(action)}>
					{#if action.icon}
						<FontAwesomeIcon icon={action.icon} />
					{/if}
					<span>{action.label}</span>
				</Button>
			{/each}
		</div>
	</div>
{/if}

<div class="table-container col-12">
	<table>
		<thead>
			<tr>
				{#if enableBulkActions}
					<th class="checkbox-column">
						<input
							type="checkbox"
							checked={allSelected}
							indeterminate={someSelected}
							onchange={toggleSelectAll}
							aria-label="Select all rows"
						/>
					</th>
				{/if}
				{#each columns as column (column.key)}
					<th
						class:sortable={column.sortable !== false}
						class:sorted={sortColumn === column.key}
						class={column.class}
						onclick={() => handleSort(column)}
					>
						<span class="th-content">
							<span class="th-label">{column.label}</span>
							{#if column.sortable !== false}
								{@const icon = getSortIcon(column)}
								{#if icon}
									<span class="sort-indicator">
										{#if sortColumn === column.key && sortDirection}
											<span
												class="sort-text"
												in:fly={{ x: -10, duration: 250 }}
												out:fly={{ x: -10, duration: 150 }}
											>
												{sortDirection.toUpperCase()}
											</span>
										{/if}
										<span class="sort-icon">
											<FontAwesomeIcon {icon} />
										</span>
									</span>
								{/if}
							{/if}
						</span>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class:sorting={isSorting}>
			{#each sortedData as item (rowKey(item))}
				<tr class={rowClass?.(item)} animate:flip={{ duration: 300 }}>
					{#if enableBulkActions}
						<td class="checkbox-column">
							<input
								type="checkbox"
								checked={isSelected(item)}
								onchange={() => toggleSelectItem(item)}
								aria-label="Select row"
							/>
						</td>
					{/if}
					{#each columns as column (column.key)}
						<td class={column.class}>
							{@render cellContent({ item, column })}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.bulk-action-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.5rem;
		margin-bottom: 1rem;
		background: rgba(var(--theme-color-rgb), 0.15);
		border: 1px solid rgba(var(--theme-color-rgb), 0.3);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.bulk-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.selected-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.5rem;
		background: var(--theme-color-2);
		color: white;
		font-weight: 700;
		font-size: 0.95rem;
		border-radius: 4px;
	}

	.selected-text {
		color: var(--text-color-1);
		font-weight: 500;
	}

	.clear-selection {
		padding: 0.4rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: var(--text-color-2);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-selection:hover {
		background: rgba(255, 255, 255, 0.15);
		color: var(--text-color-1);
	}

	.bulk-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bulk-action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		border: 1px solid transparent;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.bulk-action-btn.primary {
		background: var(--theme-color-2);
		color: white;
	}

	.bulk-action-btn.primary:hover {
		background: var(--theme-color-1);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(var(--theme-color-rgb), 0.3);
	}

	.bulk-action-btn.danger {
		background: #dc3545;
		color: white;
	}

	.bulk-action-btn.danger:hover {
		background: #c82333;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
	}

	.bulk-action-btn.warning {
		background: #ffc107;
		color: #212529;
	}

	.bulk-action-btn.warning:hover {
		background: #e0a800;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
	}

	.bulk-action-btn.success {
		background: #28a745;
		color: white;
	}

	.bulk-action-btn.success:hover {
		background: #218838;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
	}

	.checkbox-column {
		width: 50px;
		text-align: center;
		padding: 0.75rem;
	}

	.checkbox-column input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--theme-color-2);
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.15s ease;
	}

	th.sortable:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	th.sorted {
		background: rgba(var(--theme-color-rgb), 0.2);
		color: white;
		font-weight: 600;
	}

	.th-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.th-label {
		flex: 1;
	}

	.sort-indicator {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.sort-icon {
		opacity: 0.3;
		font-size: 1em;
		min-width: 1em;
		display: flex;
		align-items: center;
		transition: all 0.2s ease;
	}

	.sort-text {
		font-size: 0.7em;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: white;
		white-space: nowrap;
	}

	tbody {
		transition: opacity 0.15s ease;
	}

	tbody.sorting {
		opacity: 0.6;
	}

	tbody tr {
		transition: all 0.2s ease;
	}

	th.sortable:hover .sort-icon {
		opacity: 0.6;
	}

	th.sorted .sort-icon {
		opacity: 1;
		color: white;
		font-size: 1.1em;
		transform: scale(1.1);
	}
</style>
