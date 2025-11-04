# Adding New Permissions - Quick Guide

## 🚀 Super Easy 3-Step Process

### Step 1: Define the Permission

Open `src/lib/constants/permissions.ts` and add your permission to `PERMISSION_DEFINITIONS`:

```typescript
export const PERMISSION_DEFINITIONS: Record<string, PermissionMetadata> = {
	// ... existing permissions ...

	// Your new permission
	blog_posts_manage: {
		key: 'blog_posts_manage',
		label: 'Manage Blog Posts',
		description: 'Create, edit, and delete blog posts',
		category: 'content' // Choose: 'basic', 'admin', 'system', 'content', 'api', or 'other'
	}
};
```

**That's it!** The permission will automatically:

- ✅ Display with proper formatting
- ✅ Show in the correct category
- ✅ Have a tooltip with description
- ✅ Be color-coded by category

### Step 2: Use in Your Code

```typescript
import { PERMISSIONS } from '$lib/constants/permissions';
import { PermissionService } from '$lib/server/permissions';

// Check permission on the server
const hasPermission = await PermissionService.hasPermission(userId, PERMISSIONS.BLOG_POSTS_MANAGE);
```

### Step 3: Protect Routes (Optional)

In your `+page.server.ts`:

```typescript
import { requirePermission } from '$lib/server/permission-middleware';
import { PERMISSIONS } from '$lib/constants/permissions';

export const load = requirePermission(PERMISSIONS.BLOG_POSTS_MANAGE, async ({ locals }) => {
	// Your protected code here
});
```

---

## 📋 Permission Categories

Choose the right category for better organization:

- **`basic`** - CRUD operations (read, write, create, delete)
- **`admin`** - User & role management
- **`system`** - System configuration & logs
- **`content`** - Content management (posts, pages, media)
- **`api`** - API access permissions
- **`other`** - Everything else

---

## 🎨 Display Components

### Quick Badge

```svelte
<PermissionBadge permission="manage_users" />
```

### Full Display with Categories

```svelte
<PermissionsDisplay permissions={role.permissions} variant="compact" groupByCategory={true} />
```

### Variants

- `compact` - Small badges (best for cards)
- `default` - Normal size
- `detailed` - Shows description

---

## 💡 Examples

### Example 1: Add a "Moderate Comments" Permission

```typescript
moderate_comments: {
  key: 'moderate_comments',
  label: 'Moderate Comments',
  description: 'Approve, edit, or delete user comments',
  category: 'content'
}
```

### Example 2: Add an "Export Data" Permission

```typescript
export_data: {
  key: 'export_data',
  label: 'Export Data',
  description: 'Export data in various formats',
  category: 'api'
}
```

### Example 3: Protect a Page

```typescript
// src/routes/admin/reports/+page.server.ts
import { requirePermission } from '$lib/server/permission-middleware';
import { PERMISSIONS } from '$lib/constants/permissions';

export const load = requirePermission(PERMISSIONS.REPORTS_GENERATE, async ({ locals }) => {
	return {
		reports: await getReports()
	};
});
```

---

## 🔒 System Roles

System roles are defined in `src/lib/server/permissions.ts` and automatically created:

- **Super Admin** - Gets ALL permissions
- **Admin** - Gets most permissions
- **User** - Gets basic read permission

To modify what permissions a system role gets, edit the `SYSTEM_ROLES` object.

---

## ✨ Benefits of This System

1. **Centralized** - All permission metadata in one place
2. **Type-safe** - TypeScript ensures you use valid permissions
3. **Self-documenting** - Labels and descriptions show in UI
4. **Organized** - Automatic categorization
5. **Beautiful** - Color-coded, responsive displays
6. **Easy** - Just add one object, everything else is automatic!
