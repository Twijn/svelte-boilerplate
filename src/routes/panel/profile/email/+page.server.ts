import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { validateEmail } from '$lib/server/auth';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';

export const actions: Actions = {
	changeEmail: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const newEmail = formData.get('newEmail') as string;
		const password = formData.get('password') as string;

		// Validate inputs
		if (!newEmail || !password) {
			return fail(400, {
				message: 'Email and password are required',
				success: false
			});
		}

		if (!validateEmail(newEmail)) {
			return fail(400, {
				message: 'Invalid email format',
				success: false
			});
		}

		if (newEmail === locals.user.email) {
			return fail(400, {
				message: 'New email is the same as current email',
				success: false
			});
		}

		try {
			// Fetch current user to verify password
			const users = await db.select().from(table.user).where(eq(table.user.id, locals.user.id));

			if (users.length === 0) {
				return fail(404, {
					message: 'User not found',
					success: false
				});
			}

			const user = users[0];

			// Verify password
			const validPassword = await verify(user.passwordHash, password);
			if (!validPassword) {
				return fail(400, {
					message: 'Password is incorrect',
					success: false
				});
			}

			// Check if email is already taken
			const existingUser = await db.select().from(table.user).where(eq(table.user.email, newEmail));

			if (existingUser.length > 0) {
				return fail(400, {
					message: 'Email address is already in use',
					success: false
				});
			}

			// For now, directly update the email (in production, you'd want email verification)
			// TODO: Implement email verification flow with tokens
			await db
				.update(table.user)
				.set({
					email: newEmail,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.email.change',
				category: ActivityCategory.USER,
				message: 'User changed their email address',
				resourceType: 'user',
				resourceId: locals.user.id,
				metadata: {
					oldEmail: user.email,
					newEmail
				}
			});

			return {
				success: true,
				message: 'Email address updated successfully',
				action: 'changeEmail'
			};
		} catch (error) {
			console.error('Email change error:', error);
			return fail(500, {
				message: 'Failed to change email address',
				success: false
			});
		}
	}
};
