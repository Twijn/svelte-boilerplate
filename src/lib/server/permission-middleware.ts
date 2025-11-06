import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { PermissionService, PERMISSIONS } from './permissions';

/**
 * Permission middleware that can be used in page server files
 */
export function requirePermission(permission: string) {
	return async (userId: string | null) => {
		if (!userId) {
			throw redirect(302, '/login');
		}

		const hasPermission = await PermissionService.hasPermission(userId, permission);
		if (!hasPermission) {
			throw redirect(302, '/unauthorized');
		}

		return true;
	};
}

/**
 * Check if user has any of the specified permissions
 */
export function requireAnyPermission(permissions: string[]) {
	return async (userId: string | null) => {
		if (!userId) {
			throw redirect(302, '/login');
		}

		const hasPermission = await PermissionService.hasAnyPermission(userId, permissions);
		if (!hasPermission) {
			throw redirect(302, '/unauthorized');
		}

		return true;
	};
}

/**
 * Admin permission check
 */
export const requireAdmin = requirePermission(PERMISSIONS.ADMIN);

/**
 * User management permission check
 */
export const requireUserManagement = requirePermission(PERMISSIONS.MANAGE_USERS);

/**
 * Role management permission check
 */
export const requireRoleManagement = requirePermission(PERMISSIONS.MANAGE_ROLES);

/**
 * View logs permission check
 */
export const requireViewLogs = requirePermission(PERMISSIONS.VIEW_LOGS);

/**
 * Check permissions in a more flexible way for components
 */
export async function checkPermissions(userId: string | null, requiredPermissions: string[]) {
	if (!userId) return false;
	return await PermissionService.hasAnyPermission(userId, requiredPermissions);
}

/**
 * Store user permissions in locals for easy access
 */
export const permissionHandle: Handle = async ({ event, resolve }) => {
	if (event.locals.user) {
		event.locals.userPermissions = await PermissionService.getUserPermissions(event.locals.user.id);
	}

	return resolve(event);
};
