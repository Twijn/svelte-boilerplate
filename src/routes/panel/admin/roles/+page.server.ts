import { requireAdmin } from '$lib/server/permission-middleware';
import { PermissionService } from '$lib/server/permissions';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { PERMISSIONS } from '$lib/constants/permissions';

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

	// Get all available permissions for role creation/editing
	const availablePermissions = Object.entries(PERMISSIONS).map(([key, value]) => ({
		key,
		value,
		label: key
			.replace(/_/g, ' ')
			.toLowerCase()
			.replace(/\b\w/g, (l) => l.toUpperCase())
	}));

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

			await PermissionService.createRole(name.trim(), description?.trim() || '', permissions);
			return { success: true, message: 'Role created successfully' };
		} catch (error) {
			console.error('Error creating role:', error);
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
			// Check if role exists and is not a system role
			const role = await db.select().from(table.role).where(eq(table.role.id, roleId)).limit(1);

			if (role.length === 0) {
				return fail(404, { message: 'Role not found' });
			}

			if (role[0].isSystemRole) {
				return fail(400, { message: 'Cannot modify system roles' });
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
			return { success: true, message: 'Role updated successfully' };
		} catch (error) {
			console.error('Error updating role:', error);
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

			await PermissionService.deleteRole(roleId);
			return { success: true, message: 'Role deleted successfully' };
		} catch (error) {
			console.error('Error deleting role:', error);
			return fail(500, { message: 'Failed to delete role' });
		}
	}
};
