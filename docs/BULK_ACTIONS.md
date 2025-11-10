# Bulk Actions Feature

## Overview

The SortableTable component now supports bulk selection and actions, allowing users to select multiple rows and perform operations on them simultaneously. Bulk actions use SvelteKit's `invalidate` function to refresh data without full page reloads, providing a smooth user experience.

## What Was Added

### 1. Core Features

- **Checkbox Selection**: Click checkboxes to select individual rows
- **Select All**: Header checkbox to select/deselect all rows at once
- **Bulk Action Bar**: Animated bar that appears when items are selected
- **Customizable Actions**: Define any number of bulk actions with custom handlers
- **Action Variants**: Four built-in button styles (primary, danger, warning, success)
- **Selection Tracking**: Callback to monitor selection changes
- **Smart Data Refresh**: Uses `invalidate()` instead of page reloads for better UX

### 2. Implementation Details

#### New Component Files

- `src/lib/components/ui/SortableTable.types.ts` - TypeScript interfaces for Column and BulkAction

#### Updated Components

- `src/lib/components/ui/SortableTable.svelte` - Added bulk action functionality
- `src/lib/components/admin/UserTable.svelte` - Implemented bulk actions example

#### New Props

- `enableBulkActions?: boolean` - Enable bulk selection (default: false)
- `bulkActions?: BulkAction<T>[]` - Array of bulk action definitions
- `onSelectionChange?: (selectedItems: T[]) => void` - Selection change callback

### 3. Bulk Action Definition

```typescript
interface BulkAction<T> {
	id: string; // Unique identifier
	label: string; // Button text
	icon?: IconDefinition; // Optional FontAwesome icon
	variant?: 'primary' | 'danger' | 'warning' | 'success'; // Button style
	onClick: (selectedItems: T[]) => void | Promise<void>; // Action handler
}
```

### 4. Data Refresh Pattern

Instead of full page reloads, bulk actions use SvelteKit's dependency tracking:

**In +page.server.ts:**

```typescript
export const load = async ({ locals, depends }) => {
	depends('app:users'); // Register dependency

	// ... load data
};
```

**In +page.svelte:**

```typescript
import { invalidate } from '$app/navigation';

async function submitBulkAction() {
	// Perform bulk operation
	await invalidate('app:users'); // Trigger data refresh
}
```

This approach:

- Avoids full page reloads
- Preserves scroll position and UI state
- Provides instant visual feedback
- Maintains form state in other modals

## Usage Example

```svelte
<script lang="ts">
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import type { BulkAction } from '$lib/components/ui/SortableTable.types';
	import { confirm } from '$lib/stores/confirm';
	import { notifications } from '$lib/stores/notifications';
	import { faTrash, faFileExport } from '@fortawesome/free-solid-svg-icons';

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
			id: 'export',
			label: 'Export Selected',
			icon: faFileExport,
			variant: 'primary',
			onClick: async (selectedUsers) => {
				// Export logic here
				notifications.success(`Exported ${selectedUsers.length} users`);
			}
		},
		{
			id: 'delete',
			label: 'Delete Selected',
			icon: faTrash,
			variant: 'danger',
			onClick: async (selectedUsers) => {
				confirm.confirm({
					message: `Delete ${selectedUsers.length} users? This cannot be undone.`,
					danger: true,
					confirmButtonLabel: 'Delete',
					confirm: () => {
						// Delete logic here
						notifications.success(`Deleted ${selectedUsers.length} users`);
					}
				});
			}
		}
	];

<SortableTable
	data={users}
	{columns}
	rowKey={(user) => user.id}
	enableBulkActions={true}
	{bulkActions}
	onSelectionChange={(selected) => console.log(`${selected.length} selected`)}
>
	{#snippet cellContent({ item, column })}
		<!-- Cell rendering -->
	{/snippet}
</SortableTable>
```

## Real-World Implementation

The `UserTable` component demonstrates a complete implementation with:

### Export Action (Primary)

- Exports selected users to CSV
- Includes username, email, name, roles, and status
- Auto-downloads with timestamped filename
- Shows success notification

### Disable Action (Warning)

- Filters out already-disabled users
- Prompts for optional disable reason using prompt modal
- Applies the same reason to all selected users
- Shows count of users that will be affected
- Automatically clears selection after completion

### Enable Action (Success)

- Filters out already-enabled users
- Shows count of users that will be enabled
- Confirms before processing via modal
- Automatically clears selection after completion

### Delete Action (Danger)

- Requires confirmation via modal
- Shows count of users to be deleted
- Warns that action cannot be undone
- Automatically clears selection after completion

### Automatic Selection Clearing

- Selection is automatically cleared after any bulk action completes
- This ensures the UI stays in sync with the actual data state
- Users can immediately perform another action without manual deselection

## UI/UX Features

### Bulk Action Bar

- Slides in smoothly when items are selected
- Shows selected count with visual badge
- "Clear" button to deselect all
- Auto-hides when selection is cleared

### Checkbox Behavior

- Header checkbox shows indeterminate state when some (but not all) items selected
- Clicking header checkbox toggles all items
- Individual row checkboxes toggle single items
- Checkboxes use theme accent color

### Visual Feedback

- Selected count displayed prominently
- Action buttons color-coded by severity
- Smooth animations for selection changes
- Hover effects on action buttons

## Styling

The component includes complete styling for:

- `.bulk-action-bar` - Container for bulk actions
- `.bulk-info` - Selection count and clear button
- `.bulk-actions` - Action button container
- `.bulk-action-btn` - Individual action buttons with variants
- `.checkbox-column` - Checkbox column styling

## Best Practices

1. **Use built-in confirm modals** - Always use `confirm.confirm()` from `$lib/stores/confirm` instead of native `confirm()` for better UX and consistency
2. **Use notifications** - Show success/error notifications using `notifications` from `$lib/stores/notifications`
3. **Filter selection before processing** - Only process items that meet criteria
4. **Show clear feedback** - Use notifications to confirm action completion
5. **Handle edge cases** - Check if selection is empty or all items already in desired state
6. **Use appropriate variants** - Match button color to action severity

## Documentation

Complete documentation available in `docs/SORTABLE_TABLE.md` including:

- Basic usage examples
- Bulk action examples
- Best practices
- Real-world patterns
- Export functionality examples

## Benefits

- **Improved UX**: Users can perform batch operations efficiently
- **Consistent Interface**: Same pattern across all tables
- **Type Safety**: Full TypeScript support with generics
- **Flexible**: Easy to add custom actions for any use case
- **Accessible**: Proper ARIA labels and keyboard support
- **Performant**: Efficient selection tracking with no unnecessary re-renders
