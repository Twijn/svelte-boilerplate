// Shared permission constants that can be used on both client and server
export const PERMISSIONS = {
	// Basic CRUD permissions
	READ: 'read',
	WRITE: 'write',
	DELETE: 'delete',
	CREATE: 'create',

	// Admin permissions
	ADMIN: 'admin',
	MANAGE_USERS: 'manage_users',
	MANAGE_ROLES: 'manage_roles',
	MANAGE_PERMISSIONS: 'manage_permissions',

	// System permissions
	SYSTEM_CONFIG: 'system_config',
	VIEW_LOGS: 'view_logs',

	// Future permissions (examples)
	ANALYTICS_VIEW: 'analytics_view',
	REPORTS_GENERATE: 'reports_generate',
	API_ACCESS: 'api_access'
} as const;
