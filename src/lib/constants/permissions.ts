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

	// System permissions
	view_logs: {
		key: 'view_logs',
		label: 'View Logs',
		description: 'Access activity logs and audit trails',
		category: 'system'
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
