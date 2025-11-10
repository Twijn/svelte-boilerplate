<script lang="ts" generics="T extends Record<string, unknown>">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Snippet } from 'svelte';

	interface Column<T> {
		key: keyof T;
		label: string;
		sortable?: boolean;
		sortValue?: (item: T) => unknown; // Custom sort value extractor
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
	let isSorting = $state(false);

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
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
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
