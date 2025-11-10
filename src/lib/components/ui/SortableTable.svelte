<script lang="ts" generics="T extends Record<string, any>">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
	import type { Snippet } from 'svelte';

	interface Column<T> {
		key: keyof T;
		label: string;
		sortable?: boolean;
		sortValue?: (item: T) => any; // Custom sort value extractor
		class?: string;
	}

	interface Props {
		data: T[];
		columns: Column<T>[];
		rowKey: (item: T) => string | number;
		rowClass?: (item: T) => string;
		cellContent: Snippet<[{ item: T; column: Column<T> }]>;
	}

	const { data, columns, rowKey, rowClass, cellContent }: Props = $props();

	type SortDirection = 'asc' | 'desc' | null;

	let sortColumn = $state<keyof T | null>(null);
	let sortDirection = $state<SortDirection>(null);

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
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
				{#each columns as column}
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
									<span class="sort-icon">
										<FontAwesomeIcon {icon} />
									</span>
								{/if}
							{/if}
						</span>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedData as item (rowKey(item))}
				<tr class={rowClass?.(item)}>
					{#each columns as column}
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
	th.sortable {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.15s ease;
	}

	th.sortable:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	th.sorted {
		background: rgba(var(--theme-color-rgb), 0.1);
		color: var(--theme-color-2);
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

	.sort-icon {
		opacity: 0.5;
		font-size: 0.85em;
		min-width: 0.85em;
		display: flex;
		align-items: center;
		transition: opacity 0.15s ease;
	}

	th.sortable:hover .sort-icon,
	th.sorted .sort-icon {
		opacity: 1;
	}

	th.sorted .sort-icon {
		color: var(--theme-color-2);
	}
</style>
