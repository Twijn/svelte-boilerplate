import { requireAdmin } from '$lib/server/permission-middleware';
import { PermissionService } from '$lib/server/permissions';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import {
	generateUserId,
	validateFirstOrLastName,
	validateUsername,
	validatePassword,
	validateEmail
} from '$lib/server/auth';
import { hash } from '@node-rs/argon2';
import {
	ActivityLogService,
	ActivityCategory,
	ActivityActions,
	LogSeverity
} from '$lib/server/activity-log';

export const load = async ({ locals }) => {
	// Check if user has admin permission
	await requireAdmin(locals.user?.id || null);

	// Get all users with their roles
	const users = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			email: table.user.email,
			firstName: table.user.firstName,
			lastName: table.user.lastName,
			isLocked: table.user.isLocked,
			lockedAt: table.user.lockedAt,
			lockedUntil: table.user.lockedUntil,
			failedLoginAttempts: table.user.failedLoginAttempts,
			lastFailedLogin: table.user.lastFailedLogin,
			requirePasswordChange: table.user.requirePasswordChange
		})
		.from(table.user);

	// Get user roles for each user
	const usersWithRoles = await Promise.all(
		users.map(async (user) => {
			const roles = await PermissionService.getUserRoles(user.id);
			return {
				...user,
				roles: roles.map((r) => ({ ...r.role, assignedAt: r.assignedAt }))
			};
		})
	);

	// Get all available roles for assignment
	const allRoles = await db.select().from(table.role);

	// Calculate stats
	const totalUsers = users.length;
	const lockedUsers = users.filter((u) => u.isLocked).length;
	const usersWithFailedLogins = users.filter(
		(u) => u.failedLoginAttempts && Number(u.failedLoginAttempts) > 0
	).length;

	return {
		users: usersWithRoles,
		roles: allRoles,
		stats: {
			totalUsers,
			lockedUsers,
			usersWithFailedLogins,
			activeUsers: totalUsers - lockedUsers
		}
	};
};

export const actions = {
	assignRole: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const roleId = formData.get('roleId') as string;

		if (!userId || !roleId) {
			return fail(400, { message: 'User ID and Role ID are required' });
		}

		try {
			// Check if user already has this role
			const existingAssignment = await db
				.select()
				.from(table.userRole)
				.where(and(eq(table.userRole.userId, userId), eq(table.userRole.roleId, roleId)))
				.limit(1);

			if (existingAssignment.length > 0) {
				return fail(400, { message: 'User already has this role' });
			}

			await PermissionService.assignRole(userId, roleId, locals.user?.id);

			// Log role assignment
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.ROLE_ASSIGN,
				category: ActivityCategory.ROLE,
				severity: LogSeverity.INFO,
				resourceType: 'user',
				resourceId: userId,
				metadata: { roleId, assignedBy: locals.user?.id },
				message: `Role ${roleId} assigned to user ${userId}`,
				success: true
			});

			return { success: true, message: 'Role assigned successfully' };
		} catch (error) {
			console.error('Error assigning role:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.ROLE_ASSIGN,
				ActivityCategory.ROLE,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					resourceType: 'user',
					resourceId: userId,
					metadata: { roleId },
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to assign role' });
		}
	},

	removeRole: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const roleId = formData.get('roleId') as string;

		if (!userId || !roleId) {
			return fail(400, { message: 'User ID and Role ID are required' });
		}

		try {
			await PermissionService.removeRole(userId, roleId);

			// Log role removal
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.ROLE_REVOKE,
				category: ActivityCategory.ROLE,
				severity: LogSeverity.INFO,
				resourceType: 'user',
				resourceId: userId,
				metadata: { roleId, revokedBy: locals.user?.id },
				message: `Role ${roleId} removed from user ${userId}`,
				success: true
			});

			return { success: true, message: 'Role removed successfully' };
		} catch (error) {
			console.error('Error removing role:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.ROLE_REVOKE,
				ActivityCategory.ROLE,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					resourceType: 'user',
					resourceId: userId,
					metadata: { roleId },
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to remove role' });
		}
	},

	createUser: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;
		const password = formData.get('password') as string;
		const requirePasswordChange = formData.get('requirePasswordChange') === 'true';

		// Validate inputs
		if (!validateUsername(username)) {
			return fail(400, {
				message:
					'Invalid username. Must be 3-31 characters and contain only lowercase letters, numbers, hyphens, or underscores.'
			});
		}

		if (!validateEmail(email)) {
			return fail(400, { message: 'Invalid email address.' });
		}

		if (!validateFirstOrLastName(firstName)) {
			return fail(400, {
				message:
					'Invalid first name. Must be 1-50 characters and contain only letters, hyphens, or apostrophes.'
			});
		}

		if (!validateFirstOrLastName(lastName)) {
			return fail(400, {
				message:
					'Invalid last name. Must be 1-50 characters and contain only letters, hyphens, or apostrophes.'
			});
		}

		if (!validatePassword(password)) {
			return fail(400, { message: 'Password must be at least 6 characters long.' });
		}

		try {
			// Check if username already exists
			const existingUser = await db
				.select()
				.from(table.user)
				.where(eq(table.user.username, username))
				.limit(1);

			if (existingUser.length > 0) {
				return fail(400, { message: 'Username already exists' });
			}

			// Check if email already exists
			const existingEmail = await db
				.select()
				.from(table.user)
				.where(eq(table.user.email, email))
				.limit(1);

			if (existingEmail.length > 0) {
				return fail(400, { message: 'Email address already exists' });
			}

			// Hash password
			const passwordHash = await hash(password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			// Create user
			const userId = generateUserId();

			await db.insert(table.user).values({
				id: userId,
				username,
				email,
				firstName,
				lastName,
				passwordHash,
				requirePasswordChange
			});

			// Log user creation
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.USER_CREATE,
				category: ActivityCategory.USER,
				severity: LogSeverity.INFO,
				resourceType: 'user',
				resourceId: userId,
				metadata: { username, email, firstName, lastName, createdBy: locals.user?.id },
				message: `User created: ${username} (${email})`,
				success: true
			});

			return { success: true, message: 'User created successfully' };
		} catch (error) {
			console.error('Error creating user:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.USER_CREATE,
				ActivityCategory.USER,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					metadata: { username, email },
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to create user' });
		}
	},

	updateUser: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;
		const requirePasswordChange = formData.get('requirePasswordChange') === 'true';

		if (!userId) {
			return fail(400, { message: 'User ID is required' });
		}

		// Validate inputs
		if (!validateUsername(username)) {
			return fail(400, {
				message:
					'Invalid username. Must be 3-31 characters and contain only lowercase letters, numbers, hyphens, or underscores.'
			});
		}

		if (!validateEmail(email)) {
			return fail(400, { message: 'Invalid email address.' });
		}

		if (!validateFirstOrLastName(firstName)) {
			return fail(400, {
				message:
					'Invalid first name. Must be 1-50 characters and contain only letters, hyphens, or apostrophes.'
			});
		}

		if (!validateFirstOrLastName(lastName)) {
			return fail(400, {
				message:
					'Invalid last name. Must be 1-50 characters and contain only letters, hyphens, or apostrophes.'
			});
		}

		try {
			// Check if user exists
			const existingUser = await db
				.select()
				.from(table.user)
				.where(eq(table.user.id, userId))
				.limit(1);

			if (existingUser.length === 0) {
				return fail(404, { message: 'User not found' });
			}

			// Check if username is taken by another user
			const userWithSameUsername = await db
				.select()
				.from(table.user)
				.where(eq(table.user.username, username))
				.limit(1);

			if (userWithSameUsername.length > 0 && userWithSameUsername[0].id !== userId) {
				return fail(400, { message: 'Username already exists' });
			}

			// Check if email is taken by another user
			const userWithSameEmail = await db
				.select()
				.from(table.user)
				.where(eq(table.user.email, email))
				.limit(1);

			if (userWithSameEmail.length > 0 && userWithSameEmail[0].id !== userId) {
				return fail(400, { message: 'Email address already exists' });
			}

			// Update user
			await db
				.update(table.user)
				.set({
					username,
					email,
					firstName,
					lastName,
					requirePasswordChange
				})
				.where(eq(table.user.id, userId));

			// Log user update
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.USER_UPDATE,
				category: ActivityCategory.USER,
				severity: LogSeverity.INFO,
				resourceType: 'user',
				resourceId: userId,
				metadata: { username, email, firstName, lastName, updatedBy: locals.user?.id },
				message: `User updated: ${username}`,
				success: true
			});

			return { success: true, message: 'User updated successfully' };
		} catch (error) {
			console.error('Error updating user:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.USER_UPDATE,
				ActivityCategory.USER,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					resourceType: 'user',
					resourceId: userId,
					metadata: { username },
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to update user' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { message: 'User ID is required' });
		}

		try {
			// Prevent deleting yourself
			if (userId === locals.user?.id) {
				return fail(400, { message: 'Cannot delete your own account' });
			}

			// Check if user exists
			const existingUser = await db
				.select()
				.from(table.user)
				.where(eq(table.user.id, userId))
				.limit(1);

			if (existingUser.length === 0) {
				return fail(404, { message: 'User not found' });
			}

			// Delete user's roles first
			await db.delete(table.userRole).where(eq(table.userRole.userId, userId));

			// Delete user's sessions
			await db.delete(table.session).where(eq(table.session.userId, userId));

			// Log user deletion (before deleting)
			const deletedUsername = existingUser[0].username;
			const deletedEmail = existingUser[0].email;

			// Delete user
			await db.delete(table.user).where(eq(table.user.id, userId));

			// Log user deletion
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.USER_DELETE,
				category: ActivityCategory.USER,
				severity: LogSeverity.WARNING,
				resourceType: 'user',
				resourceId: userId,
				metadata: { username: deletedUsername, email: deletedEmail, deletedBy: locals.user?.id },
				message: `User deleted: ${deletedUsername} (${deletedEmail})`,
				success: true
			});

			return { success: true, message: 'User deleted successfully' };
		} catch (error) {
			console.error('Error deleting user:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.USER_DELETE,
				ActivityCategory.USER,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					resourceType: 'user',
					resourceId: userId,
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to delete user' });
		}
	},

	unlockUser: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { message: 'User ID is required' });
		}

		try {
			// Check if user exists
			const existingUser = await db
				.select()
				.from(table.user)
				.where(eq(table.user.id, userId))
				.limit(1);

			if (existingUser.length === 0) {
				return fail(404, { message: 'User not found' });
			}

			// Unlock the user account
			await db
				.update(table.user)
				.set({
					isLocked: false,
					lockedAt: null,
					lockedUntil: null,
					failedLoginAttempts: '0',
					lastFailedLogin: null
				})
				.where(eq(table.user.id, userId));

			// Log account unlock
			await ActivityLogService.log({
				userId: locals.user?.id,
				ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
				userAgent: request.headers.get('user-agent'),
				action: ActivityActions.USER_UNLOCK,
				category: ActivityCategory.USER,
				severity: LogSeverity.INFO,
				resourceType: 'user',
				resourceId: userId,
				metadata: { unlockedBy: locals.user?.id },
				message: `User account unlocked: ${existingUser[0].username}`,
				success: true
			});

			return { success: true, message: 'Account unlocked successfully' };
		} catch (error) {
			console.error('Error unlocking user:', error);

			// Log failure
			await ActivityLogService.logFailure(
				ActivityActions.USER_UNLOCK,
				ActivityCategory.USER,
				error instanceof Error ? error.message : 'Unknown error',
				{
					userId: locals.user?.id,
					ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
					userAgent: request.headers.get('user-agent'),
					resourceType: 'user',
					resourceId: userId,
					severity: LogSeverity.ERROR
				}
			);

			return fail(500, { message: 'Failed to unlock account' });
		}
	}
};
