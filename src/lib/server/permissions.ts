import { eq, and, or, isNull, gt } from 'drizzle-orm';
import { db } from './db';
import * as table from './db/schema';
import { generateId } from '$lib/server/utils';

import { PERMISSIONS } from '$lib/constants/permissions';

// Re-export for convenience
export { PERMISSIONS };

export class PermissionService {
	/**
	 * Assign a role to a user
	 */
	static async assignRole(userId: string, roleId: string, assignedBy?: string) {
		const userRoleId = generateId();
		await db.insert(table.userRole).values({
			id: userRoleId,
			userId,
			roleId,
			assignedAt: new Date(),
			assignedBy
		});
		return userRoleId;
	}

	/**
	 * Remove a role from a user
	 */
	static async removeRole(userId: string, roleId: string) {
		await db
			.delete(table.userRole)
			.where(and(eq(table.userRole.userId, userId), eq(table.userRole.roleId, roleId)));
	}

	/**
	 * Get all permissions for a user (from all their roles)
	 */
	static async getUserPermissions(userId: string): Promise<string[]> {
		const userRoles = await db
			.select({
				permissions: table.role.permissions
			})
			.from(table.userRole)
			.innerJoin(table.role, eq(table.userRole.roleId, table.role.id))
			.where(eq(table.userRole.userId, userId));

		// Flatten and deduplicate permissions
		const allPermissions = userRoles.flatMap((role) => role.permissions || []);
		return [...new Set(allPermissions)];
	}

	/**
	 * Check if a user has a specific permission
	 */
	static async hasPermission(userId: string, permission: string): Promise<boolean> {
		const permissions = await this.getUserPermissions(userId);
		return permissions.includes(permission) || permissions.includes(PERMISSIONS.ADMIN);
	}

	/**
	 * Check if a user has any of the specified permissions
	 */
	static async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
		const userPermissions = await this.getUserPermissions(userId);
		return permissions.some(
			(permission) =>
				userPermissions.includes(permission) || userPermissions.includes(PERMISSIONS.ADMIN)
		);
	}

	/**
	 * Check if a user has all of the specified permissions
	 */
	static async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
		const userPermissions = await this.getUserPermissions(userId);
		if (userPermissions.includes(PERMISSIONS.ADMIN)) return true;

		return permissions.every((permission) => userPermissions.includes(permission));
	}

	/**
	 * Get all roles for a user
	 */
	static async getUserRoles(userId: string) {
		return await db
			.select({
				role: table.role,
				assignedAt: table.userRole.assignedAt
			})
			.from(table.userRole)
			.innerJoin(table.role, eq(table.userRole.roleId, table.role.id))
			.where(eq(table.userRole.userId, userId));
	}

	/**
	 * Create a custom role
	 */
	static async createRole(name: string, description: string, permissions: string[]) {
		const roleId = generateId();
		await db.insert(table.role).values({
			id: roleId,
			name,
			description,
			permissions,
			isSystemRole: false,
			createdAt: new Date()
		});
		return roleId;
	}

	/**
	 * Update role permissions
	 */
	static async updateRolePermissions(roleId: string, permissions: string[]) {
		await db.update(table.role).set({ permissions }).where(eq(table.role.id, roleId));
	}

	/**
	 * Delete a role (only non-system roles)
	 */
	static async deleteRole(roleId: string) {
		await db
			.delete(table.role)
			.where(and(eq(table.role.id, roleId), eq(table.role.isSystemRole, false)));
	}

	// Future: Node-based permissions methods
	/**
	 * Grant permission to a specific node/resource
	 */
	static async grantNodePermission(
		userId: string,
		nodeId: string,
		permissions: string[],
		grantedBy?: string,
		expiresAt?: Date
	) {
		const permissionId = generateId();
		await db.insert(table.userNodePermission).values({
			id: permissionId,
			userId,
			nodeId,
			permissions,
			grantedAt: new Date(),
			grantedBy,
			expiresAt
		});
		return permissionId;
	}

	/**
	 * Check if user has permission on a specific node
	 */
	static async hasNodePermission(
		userId: string,
		nodePath: string,
		permission: string
	): Promise<boolean> {
		// First check if user has global permission
		if (await this.hasPermission(userId, permission)) {
			return true;
		}

		// Then check node-specific permissions
		const nodePermissions = await db
			.select({
				permissions: table.userNodePermission.permissions
			})
			.from(table.userNodePermission)
			.innerJoin(table.permissionNode, eq(table.userNodePermission.nodeId, table.permissionNode.id))
			.where(
				and(
					eq(table.userNodePermission.userId, userId),
					eq(table.permissionNode.nodePath, nodePath),
					or(
						isNull(table.userNodePermission.expiresAt),
						gt(table.userNodePermission.expiresAt, new Date())
					)
				)
			);

		return nodePermissions.some((np) => np.permissions.includes(permission));
	}

	/**
	 * Get total number of users
	 */
	async getUserCount(): Promise<number> {
		const result = await db.select({ count: table.user.id }).from(table.user);

		return result.length;
	}

	/**
	 * Get total number of roles
	 */
	async getRoleCount(): Promise<number> {
		const result = await db.select({ count: table.role.id }).from(table.role);

		return result.length;
	}
}
