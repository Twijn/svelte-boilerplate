# SortableTable Component

A generic, reusable table component with built-in sorting functionality, optional bulk actions, and support for both client-side and server-side sorting.

## Features

- ✅ Click column headers to sort (asc → desc → unsorted)
- ✅ Visual sort indicators (▲/▼)
- ✅ **Client-side sorting** for small datasets
- ✅ **Server-side sorting** for large datasets with pagination
- ✅ Supports text, numbers, dates, and booleans
- ✅ Custom sort value extractors
- ✅ **Bulk selection with checkboxes**
- ✅ **Customizable bulk action buttons**
- ✅ **Select all / clear selection**
- ✅ Fully typed with TypeScript generics
- ✅ Uses existing table styles from app.css

## Basic Usage

```svelte
<script lang="ts">
	import SortableTable from '$lib/components/ui/SortableTable.svelte';

	interface User {
		id: string;
		username: string;
		email: string;
		createdAt: Date;
	}

	const users: User[] = $state([
		{ id: '1', username: 'alice', email: 'alice@example.com', createdAt: new Date('2024-01-01') },
		{ id: '2', username: 'bob', email: 'bob@example.com', createdAt: new Date('2024-02-01') }
	]);

	const columns = [
		{ key: 'username', label: 'Username' },
		{ key: 'email', label: 'Email' },
		{ key: 'createdAt', label: 'Created', sortValue: (user) => user.createdAt.getTime() }
	];
</script>

<SortableTable data={users} {columns} rowKey={(user) => user.id}>
	{#snippet cellContent({ item, column })}
		{#if column.key === 'username'}
			<strong>@{item.username}</strong>
		{:else if column.key === 'email'}
			{item.email}
		{:else if column.key === 'createdAt'}
			{item.createdAt.toLocaleDateString()}
		{/if}
	{/snippet}
</SortableTable>
```

## Bulk Actions Example

```svelte
<script lang="ts">
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import type { BulkAction } from '$lib/components/ui/SortableTable.types';
	import { confirm } from '$lib/stores/confirm';
	import { notifications } from '$lib/stores/notifications';
	import { faTrash, faFileExport, faLock } from '@fortawesome/free-solid-svg-icons';

	interface User {
		id: string;
		username: string;
		email: string;
		isDisabled: boolean;
	}

	const users: User[] = $state([
		{ id: '1', username: 'alice', email: 'alice@example.com', isDisabled: false },
		{ id: '2', username: 'bob', email: 'bob@example.com', isDisabled: false }
	]);

	const columns = [
		{ key: 'username', label: 'Username' },
		{ key: 'email', label: 'Email' }
	];

	const bulkActions: BulkAction<User>[] = [
		{
			id: 'disable',
			label: 'Disable Users',
			icon: faLock,
			variant: 'warning',
			onClick: async (selectedUsers) => {
				confirm.confirm({
					message: `Disable ${selectedUsers.length} users? They will not be able to log in.`,
					danger: true,
					confirmButtonLabel: 'Disable',
					confirm: () => {
						// Handle bulk disable
						notifications.success(`Disabled ${selectedUsers.length} users`);
					}
				});
			}
		},
		{
			id: 'export',
			label: 'Export',
			icon: faFileExport,
			variant: 'primary',
			onClick: async (selectedUsers) => {
				// Handle export
				const csv = selectedUsers.map((u) => `${u.username},${u.email}`).join('\n');
				// Download CSV logic here
				notifications.success(`Exported ${selectedUsers.length} users`);
			}
		},
		{
			id: 'delete',
			label: 'Delete',
			icon: faTrash,
			variant: 'danger',
			onClick: async (selectedUsers) => {
				confirm.confirm({
					message: `Delete ${selectedUsers.length} users? This cannot be undone.`,
					danger: true,
					confirmButtonLabel: 'Delete',
					confirm: () => {
						// Handle deletion
						notifications.success(`Deleted ${selectedUsers.length} users`);
					}
				});
			}
		}
	];

	function handleSelectionChange(selectedUsers: User[]) {
		console.log('Selection changed:', selectedUsers.length, 'users selected');
	}
</script>

<SortableTable
	data={users}
	{columns}
	rowKey={(user) => user.id}
	enableBulkActions={true}
	{bulkActions}
	onSelectionChange={handleSelectionChange}
>
	{#snippet cellContent({ item, column })}
		{#if column.key === 'username'}
			<strong>@{item.username}</strong>
		{:else if column.key === 'email'}
			{item.email}
		{/if}
	{/snippet}
</SortableTable>
```

## Props

### `data: T[]`

Array of items to display in the table.

### `columns: Column<T>[]`

Column configuration array. Each column has:

- `key: keyof T` - Property key from the data object
- `label: string` - Display name in header
- `sortable?: boolean` - Whether column is sortable (default: true)
- `sortValue?: (item: T) => any` - Custom sort value extractor
- `class?: string` - CSS class for the column

### `rowKey: (item: T) => string | number`

Function that returns a unique key for each row.

### `rowClass?: (item: T) => string`

Optional function that returns CSS classes for the row.

### `cellContent: Snippet<[{ item: T; column: Column<T> }]>`

Snippet for rendering cell content.

### `enableBulkActions?: boolean`

Enable bulk selection and actions (default: false).

### `bulkActions?: BulkAction<T>[]`

Array of bulk action buttons. Each action has:

- `id: string` - Unique identifier
- `label: string` - Button text
- `icon?: IconDefinition` - Optional FontAwesome icon
- `variant?: 'primary' | 'danger' | 'warning' | 'success'` - Button style
- `onClick: (selectedItems: T[]) => void | Promise<void>` - Action handler

### `onSelectionChange?: (selectedItems: T[]) => void`

Callback when selection changes. Receives array of selected items.

### Server-Side Sorting Props

For large datasets with pagination, use server-side sorting:

#### `serverSideSort?: boolean`

Enable server-side sorting (default: false). When true, sorting will trigger the `onSort` callback instead of sorting data locally.

#### `currentSortColumn?: keyof T | null`

The currently sorted column from the server.

#### `currentSortDirection?: 'asc' | 'desc' | null`

The current sort direction from the server.

#### `onSort?: (column: keyof T, direction: 'asc' | 'desc' | null) => void`

Callback when user clicks to sort. Receives the column key and new direction.

## Server-Side Sorting Example

For paginated data with server-side sorting (like activity logs):

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	const { data } = $props();

	const columns = [
		{ key: 'createdAt', label: 'Timestamp', sortable: true },
		{ key: 'action', label: 'Action', sortable: true },
		{ key: 'userId', label: 'User', sortable: true }
	];

	function handleSort(column: string, direction: 'asc' | 'desc' | null) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		if (direction === null) {
			params.delete('sortBy');
			params.delete('sortDirection');
		} else {
			params.set('sortBy', String(column));
			params.set('sortDirection', direction);
		}
		params.set('page', '1'); // Reset to first page
		goto(`?${params.toString()}`);
	}

	function changePage(newPage: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(newPage));
		goto(`?${params.toString()}`);
	}
</script>

<SortableTable
	data={data.logs}
	{columns}
	rowKey={(log) => log.id}
	serverSideSort={true}
	currentSortColumn={data.sorting.sortBy}
	currentSortDirection={data.sorting.sortDirection}
	onSort={handleSort}
>
	{#snippet cellContent({ item, column })}
		{#if column.key === 'createdAt'}
			{new Date(item.createdAt).toLocaleString()}
		{:else if column.key === 'action'}
			{item.action}
		{:else if column.key === 'userId'}
			{item.userId}
		{/if}
	{/snippet}
</SortableTable>

<Pagination
	currentPage={data.pagination.page}
	totalPages={data.pagination.totalPages}
	{changePage}
/>
```

**Server-side (+page.server.ts):**

```typescript
export const load: PageServerLoad = async ({ url, depends }) => {
	depends('app:data');

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDirection = (url.searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';

	const logs = await queryLogs({
		limit,
		offset: (page - 1) * limit,
		sortBy,
		sortDirection
	});

	const total = await countLogs();

	return {
		logs,
		pagination: {
			page,
			totalPages: Math.ceil(total / limit)
		},
		sorting: {
			sortBy,
			sortDirection
		}
	};
};
```

This approach:

- ✅ Sorts across **all** records, not just the current page
- ✅ Works with pagination
- ✅ Efficient for large datasets
- ✅ Preserves sort state in URL (shareable, bookmarkable)

## Advanced Example with Custom Sorting

```svelte
<script lang="ts">
	import SortableTable from '$lib/components/ui/SortableTable.svelte';

	interface Config {
		key: string;
		value: string | number | boolean;
		category: string;
		isDefault: boolean;
	}

	const configs: Config[] = $state([
		// your config data here
	]);

	const columns = [
		{
			key: 'key',
			label: 'Setting',
			class: 'setting-col'
		},
		{
			key: 'value',
			label: 'Current Value',
			sortValue: (config) => String(config.value) // Convert all to string for sorting
		},
		{
			key: 'category',
			label: 'Category'
		},
		{
			key: 'isDefault',
			label: 'Status',
			sortValue: (config) => (config.isDefault ? 1 : 0) // Modified configs first
		}
	];
</script>

<SortableTable
	data={configs}
	{columns}
	rowKey={(config) => config.key}
	rowClass={(config) => (config.isDefault ? '' : 'modified')}
>
	{#snippet cellContent({ item, column })}
		{#if column.key === 'key'}
			<code>{item.key}</code>
			{#if !item.isDefault}
				<span class="badge badge-warning">Modified</span>
			{/if}
		{:else if column.key === 'value'}
			<code>{String(item.value)}</code>
		{:else if column.key === 'category'}
			<span class="badge">{item.category}</span>
		{:else if column.key === 'isDefault'}
			{item.isDefault ? 'Default' : 'Modified'}
		{/if}
	{/snippet}
</SortableTable>
```

## Disabling Sort on Specific Columns

```svelte
const columns = [
	{ key: 'name', label: 'Name' }, // Sortable by default
	{ key: 'actions', label: 'Actions', sortable: false } // Not sortable
];
```

## Styling

The component uses these CSS classes:

- `.sortable` - Applied to sortable column headers
- `.sorted` - Applied to currently sorted column
- `.sort-icon` - Container for sort indicator
- `.th-content` - Flexbox container for header content

You can override these in your component's `<style>` block:

```svelte
<style>
	:global(.sortable) {
		color: var(--custom-color);
	}
</style>
```

## Migration from Regular Tables

**Before:**

```svelte
<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Email</th>
			</tr>
		</thead>
		<tbody>
			{#each users as user}
				<tr>
					<td>{user.name}</td>
					<td>{user.email}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
```

**After:**

```svelte
<SortableTable
	data={users}
	columns={[
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email' }
	]}
	rowKey={(user) => user.id}
>
	{#snippet cellContent({ item, column })}
		{item[column.key]}
	{/snippet}
</SortableTable>
```

## Bulk Actions Best Practices

### Action Variants

Choose appropriate variants for different action types:

- **`primary`** - Default actions (export, view, edit)
- **`danger`** - Destructive actions (delete, remove)
- **`warning`** - Caution required (disable, lock, suspend)
- **`success`** - Positive actions (enable, approve, activate)

### Confirmation Prompts

Always use the built-in confirm modal for destructive or bulk operations:

```typescript
import { confirm } from '$lib/stores/confirm';
import { notifications } from '$lib/stores/notifications';

{
	id: 'delete',
	label: 'Delete Selected',
	icon: faTrash,
	variant: 'danger',
	onClick: async (selectedItems) => {
		confirm.confirm({
			message: `Delete ${selectedItems.length} items? This cannot be undone.`,
			danger: true,
			confirmButtonLabel: 'Delete',
			confirm: () => {
				// Perform deletion
				notifications.success(`Deleted ${selectedItems.length} items`);
			}
		});
	}
}
```

### Filtering Selected Items

Filter out items that don't meet criteria before processing:

```typescript
{
	id: 'enable',
	label: 'Enable Selected',
	variant: 'success',
	onClick: async (selectedUsers) => {
		const disabledUsers = selectedUsers.filter(u => u.isDisabled);
		if (disabledUsers.length === 0) {
			notifications.warning('No disabled users selected');
			return;
		}

		confirm.confirm({
			message: `Enable ${disabledUsers.length} user${disabledUsers.length !== 1 ? 's' : ''}?`,
			confirmButtonLabel: 'Enable',
			confirm: () => {
				// Process only disabled users
				notifications.success(`Enabled ${disabledUsers.length} users`);
			}
		});
	}
}
```

### Export Functionality

Example CSV export implementation:

```typescript
{
	id: 'export',
	label: 'Export to CSV',
	icon: faFileExport,
	variant: 'primary',
	onClick: async (items) => {
		const headers = ['Name', 'Email', 'Status'];
		const rows = items.map(item => [item.name, item.email, item.status]);
		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
}
```

### Selection Tracking

Use the `onSelectionChange` callback to track selections:

```typescript
function handleSelectionChange(selectedItems: User[]) {
	console.log(`${selectedItems.length} items selected`);
	// Update UI, enable/disable buttons, etc.
}
```

## Real-World Example

See `src/lib/components/admin/UserTable.svelte` for a complete implementation with:

- Multiple bulk actions (Export, Disable, Enable, Delete)
- Smart filtering (only enable disabled users, etc.)
- CSV export functionality
- Confirmation dialogs
- Proper TypeScript typing
