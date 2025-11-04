import { requireAdmin } from '$lib/server/permission-middleware';
import { PermissionService } from '$lib/server/permissions';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import {
	ActivityLogService,
	ActivityCategory,
	ActivityActions,
	LogSeverity
} from '$lib/server/activity-log';

import { getAllPermissions } from '$lib/constants/permissions';

export const load = async ({ locals }) => {
	// Check if user has admin permission
	await requireAdmin(locals.user?.id || null);

	// Get all roles with user counts
	const roles = await db.select().from(table.role);

	const rolesWithUsers = await Promise.all(
		roles.map(async (role) => {
			const userRoles = await db
				.select({ userId: table.userRole.userId })
				.from(table.userRole)
				.where(eq(table.userRole.roleId, role.id));

			const users = await Promise.all(
				userRoles.map(async (ur) => {
					const user = await db
						.select({
							id: table.user.id,
							username: table.user.username,
							firstName: table.user.firstName,
							lastName: table.user.lastName
						})
						.from(table.user)
						.where(eq(table.user.id, ur.userId))
						.limit(1);
					return user[0];
				})
			);

			return {
				...role,
				userCount: userRoles.length,
				users: users.filter(Boolean)
			};
		})
	);

	// Get all available permissions from the new permission system
	const availablePermissions = getAllPermissions();

	return {
		roles: rolesWithUsers,
		availablePermissions
	};
};

export const actions = {
	createRole: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const permissions = formData.getAll('permissions') as string[];

		if (!name || name.trim().length === 0) {
			return fail(400, { message: 'Role name is required' });
		}

		if (permissions.length === 0) {
			return fail(400, { message: 'At least one permission is required' });
		}

		try {
			// Check if role name already exists
			const existingRole = await db
				.select()
				.from(table.role)
				.where(eq(table.role.name, name.trim()))
				.limit(1);

			if (existingRole.length > 0) {
				return fail(400, { message: 'A role with this name already exists' });
			}

			const roleId = await PermissionService.createRole(
				name.trim(),
				description?.trim() || '',
				permissions
			);

			// Log role creation
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.ROLE_CREATE,
				category: ActivityCategory.ROLE,
				severity: LogSeverity.INFO,
				resourceType: 'role',
				resourceId: roleId,
				metadata: {
					name: name.trim(),
					description: description?.trim(),
					permissions,
					createdBy: locals.user?.id
				},
				message: `Role created: ${name.trim()}`,
				success: true
			});

			return { success: true, message: 'Role created successfully' };
		} catch (error) {
			console.error('Error creating role:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.ROLE_CREATE,
				ActivityCategory.ROLE,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					metadata: { name: name.trim() },
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to create role' });
		}
	},

	updateRole: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const roleId = formData.get('roleId') as string;
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const permissions = formData.getAll('permissions') as string[];

		if (!roleId) {
			return fail(400, { message: 'Role ID is required' });
		}

		if (!name || name.trim().length === 0) {
			return fail(400, { message: 'Role name is required' });
		}

		if (permissions.length === 0) {
			return fail(400, { message: 'At least one permission is required' });
		}

		try {
			// Check if role exists
			const role = await db.select().from(table.role).where(eq(table.role.id, roleId)).limit(1);

			if (role.length === 0) {
				return fail(404, { message: 'Role not found' });
			}

			// Super admin cannot be modified
			if (role[0].id === 'super-admin') {
				return fail(400, { message: 'Cannot modify the Super Admin role' });
			}

			// Check if name is taken by another role
			const roleWithSameName = await db
				.select()
				.from(table.role)
				.where(eq(table.role.name, name.trim()))
				.limit(1);

			if (roleWithSameName.length > 0 && roleWithSameName[0].id !== roleId) {
				return fail(400, { message: 'A role with this name already exists' });
			}

			// Update role name and description
			await db
				.update(table.role)
				.set({
					name: name.trim(),
					description: description?.trim() || ''
				})
				.where(eq(table.role.id, roleId));

			// Update permissions
			await PermissionService.updateRolePermissions(roleId, permissions);

			// Log role update
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.ROLE_UPDATE,
				category: ActivityCategory.ROLE,
				severity: LogSeverity.INFO,
				resourceType: 'role',
				resourceId: roleId,
				metadata: {
					name: name.trim(),
					description: description?.trim(),
					permissions,
					updatedBy: locals.user?.id,
					isSystemRole: role[0].isSystemRole
				},
				message: `Role updated: ${name.trim()}`,
				success: true
			});

			return { success: true, message: 'Role updated successfully' };
		} catch (error) {
			console.error('Error updating role:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.ROLE_UPDATE,
				ActivityCategory.ROLE,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					resourceType: 'role',
					resourceId: roleId,
					metadata: { name: name.trim() },
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to update role' });
		}
	},

	deleteRole: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const roleId = formData.get('roleId') as string;

		if (!roleId) {
			return fail(400, { message: 'Role ID is required' });
		}

		try {
			// Check if role exists and is not a system role
			const role = await db.select().from(table.role).where(eq(table.role.id, roleId)).limit(1);

			if (role.length === 0) {
				return fail(404, { message: 'Role not found' });
			}

			if (role[0].isSystemRole) {
				return fail(400, { message: 'Cannot delete system roles' });
			}

			// Check if role is assigned to any users
			const userRoles = await db
				.select()
				.from(table.userRole)
				.where(eq(table.userRole.roleId, roleId));

			if (userRoles.length > 0) {
				return fail(400, {
					message: `Cannot delete role: it is assigned to ${userRoles.length} user(s). Remove the role from all users first.`
				});
			}

			// Log role deletion (before deleting)
			const deletedRoleName = role[0].name;

			await PermissionService.deleteRole(roleId);

			// Log role deletion
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.ROLE_DELETE,
				category: ActivityCategory.ROLE,
				severity: LogSeverity.WARNING,
				resourceType: 'role',
				resourceId: roleId,
				metadata: { name: deletedRoleName, deletedBy: locals.user?.id },
				message: `Role deleted: ${deletedRoleName}`,
				success: true
			});

			return { success: true, message: 'Role deleted successfully' };
		} catch (error) {
			console.error('Error deleting role:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.ROLE_DELETE,
				ActivityCategory.ROLE,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					resourceType: 'role',
					resourceId: roleId,
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to delete role' });
		}
	}
};
