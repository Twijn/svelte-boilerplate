# SortableTable Component

A generic, reusable table component with built-in sorting functionality.

## Features

- ✅ Click column headers to sort (asc → desc → unsorted)
- ✅ Visual sort indicators (▲/▼)
- ✅ Supports text, numbers, dates, and booleans
- ✅ Custom sort value extractors
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

	const configs: Config[] = $state([...]);

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
			sortValue: (config) => config.isDefault ? 1 : 0 // Modified configs first
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
