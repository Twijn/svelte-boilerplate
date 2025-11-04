import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { validatePassword } from '$lib/server/auth';
import {
	validatePasswordResetToken,
	deletePasswordResetToken,
	sendPasswordChangedNotification
} from '$lib/server/password-reset';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	// If user is already logged in, redirect to home
	if (locals.user) {
		return redirect(302, '/panel');
	}

	const token = url.searchParams.get('token');

	if (!token) {
		return {
			error: 'Invalid or missing reset token'
		};
	}

	// Validate token
	const userId = await validatePasswordResetToken(token);

	if (!userId) {
		return {
			error: 'This password reset link is invalid or has expired'
		};
	}

	return {
		token,
		valid: true
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');

		if (typeof token !== 'string' || !token) {
			return fail(400, {
				error: 'Invalid reset token'
			});
		}

		if (!validatePassword(password)) {
			return fail(400, {
				error: 'Password must be at least 6 characters long'
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match'
			});
		}

		// Validate token
		const userId = await validatePasswordResetToken(token);

		if (!userId) {
			return fail(400, {
				error: 'This password reset link is invalid or has expired'
			});
		}

		try {
			// Hash new password
			const passwordHash = await hash(password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			// Update password
			await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, userId));

			// Delete all sessions for this user (force re-login with new password)
			await db.delete(table.session).where(eq(table.session.userId, userId));

			// Delete the reset token
			await deletePasswordResetToken(token);

			// Send confirmation email
			await sendPasswordChangedNotification(userId);

			return {
				success: true
			};
		} catch (error) {
			console.error('Password reset error:', error);
			return fail(500, {
				error: 'Failed to reset password. Please try again.'
			});
		}
	}
};
