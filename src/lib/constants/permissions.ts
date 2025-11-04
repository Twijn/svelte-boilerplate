// Permission metadata for better display and organization
export interface PermissionMetadata {
	key: string;
	label: string;
	description: string;
	category: 'basic' | 'admin' | 'system' | 'content' | 'api' | 'other';
	icon?: string; // Optional: for future icon support
}

// Define all permissions with metadata
export const PERMISSION_DEFINITIONS: Record<string, PermissionMetadata> = {
	// Basic CRUD permissions
	read: {
		key: 'read',
		label: 'Read',
		description: 'View content and data',
		category: 'basic'
	},
	write: {
		key: 'write',
		label: 'Write',
		description: 'Edit and update content',
		category: 'basic'
	},
	create: {
		key: 'create',
		label: 'Create',
		description: 'Create new content',
		category: 'basic'
	},
	delete: {
		key: 'delete',
		label: 'Delete',
		description: 'Delete content permanently',
		category: 'basic'
	},

	// Admin permissions
	admin: {
		key: 'admin',
		label: 'Administrator',
		description: 'Full administrative access (grants all permissions)',
		category: 'admin'
	},
	manage_users: {
		key: 'manage_users',
		label: 'Manage Users',
		description: 'Create, edit, and manage user accounts',
		category: 'admin'
	},
	manage_roles: {
		key: 'manage_roles',
		label: 'Manage Roles',
		description: 'Create and modify user roles',
		category: 'admin'
	},
	manage_permissions: {
		key: 'manage_permissions',
		label: 'Manage Permissions',
		description: 'Assign and revoke permissions',
		category: 'admin'
	},

	// System permissions
	system_config: {
		key: 'system_config',
		label: 'System Configuration',
		description: 'Access and modify system settings',
		category: 'system'
	},
	view_logs: {
		key: 'view_logs',
		label: 'View Logs',
		description: 'Access activity logs and audit trails',
		category: 'system'
	},

	// Content permissions (examples - add your own!)
	analytics_view: {
		key: 'analytics_view',
		label: 'View Analytics',
		description: 'Access analytics and reports',
		category: 'content'
	},
	reports_generate: {
		key: 'reports_generate',
		label: 'Generate Reports',
		description: 'Create and export reports',
		category: 'content'
	},

	// API permissions
	api_access: {
		key: 'api_access',
		label: 'API Access',
		description: 'Access API endpoints',
		category: 'api'
	}
} as const;

// Simple permission keys for easy reference
export const PERMISSIONS = Object.keys(PERMISSION_DEFINITIONS).reduce(
	(acc, key) => {
		acc[key.toUpperCase()] = key;
		return acc;
	},
	{} as Record<string, string>
) as {
	READ: 'read';
	WRITE: 'write';
	CREATE: 'create';
	DELETE: 'delete';
	ADMIN: 'admin';
	MANAGE_USERS: 'manage_users';
	MANAGE_ROLES: 'manage_roles';
	MANAGE_PERMISSIONS: 'manage_permissions';
	SYSTEM_CONFIG: 'system_config';
	VIEW_LOGS: 'view_logs';
	ANALYTICS_VIEW: 'analytics_view';
	REPORTS_GENERATE: 'reports_generate';
	API_ACCESS: 'api_access';
};

// Helper functions
export function getPermissionLabel(key: string): string {
	return (
		PERMISSION_DEFINITIONS[key]?.label ||
		key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	);
}

export function getPermissionDescription(key: string): string {
	return PERMISSION_DEFINITIONS[key]?.description || '';
}

export function getPermissionCategory(key: string): string {
	return PERMISSION_DEFINITIONS[key]?.category || 'other';
}

export function getPermissionsByCategory(category: string): PermissionMetadata[] {
	return Object.values(PERMISSION_DEFINITIONS).filter((p) => p.category === category);
}

export function getAllPermissions(): PermissionMetadata[] {
	return Object.values(PERMISSION_DEFINITIONS);
}

export function getPermissionCategories(): Array<{ key: string; label: string }> {
	return [
		{ key: 'basic', label: 'Basic Permissions' },
		{ key: 'admin', label: 'Administration' },
		{ key: 'system', label: 'System' },
		{ key: 'content', label: 'Content' },
		{ key: 'api', label: 'API' },
		{ key: 'other', label: 'Other' }
	];
}
