import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { PermissionService, SYSTEM_ROLES } from '$lib/server/permissions';
import { RateLimitService } from '$lib/server/rate-limit';
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

export const load = async ({ locals }) => {
	if (locals.user) {
		return redirect(302, '/panel');
	}
};

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		const email = formData.get('email');
		const firstName = formData.get('first-name');
		const lastName = formData.get('last-name');

		// Get client IP for rate limiting
		const clientIP =
			event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
			event.getClientAddress();

		// Check rate limit for registration
		const rateLimitCheck = await RateLimitService.checkRateLimit(clientIP, 'register');
		if (!rateLimitCheck.allowed) {
			return fail(429, {
				message: `Too many registration attempts. Please try again in ${Math.ceil(rateLimitCheck.retryAfter! / 60)} minutes.`,
				username: String(username || ''),
				email: String(email || ''),
				firstName: String(firstName || ''),
				lastName: String(lastName || '')
			});
		}

		const exit = (message: string) => {
			return fail(400, {
				message,
				username: String(username || ''),
				email: String(email || ''),
				firstName: String(firstName || ''),
				lastName: String(lastName || '')
			});
		};

		if (!auth.validateEmail(email)) {
			return exit('Invalid email address');
		}
		if (!auth.validateUsername(username)) {
			return exit('Invalid username (min 3, max 31 characters, alphanumeric only)');
		}
		if (!auth.validatePassword(password)) {
			return exit('Invalid password (min 6, max 255 characters)');
		}
		if (!auth.validateFirstOrLastName(firstName)) {
			return exit(
				'Invalid first name. Make sure it is between 1 and 50 characters long and contains only letters, apostrophes, and hyphens.'
			);
		}
		if (!auth.validateFirstOrLastName(lastName)) {
			return exit(
				'Invalid last name. Make sure it is between 1 and 50 characters long and contains only letters, apostrophes, and hyphens.'
			);
		}

		const userId = auth.generateUserId();
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			await db.insert(table.user).values({
				id: userId,
				username,
				email,
				passwordHash,
				firstName,
				lastName
			});

			// Record successful registration
			await RateLimitService.recordAttempt(clientIP, 'register');

			// Log successful registration
			await ActivityLogService.log({
				userId,
				ipAddress: clientIP,
				userAgent: event.request.headers.get('user-agent'),
				action: ActivityActions.REGISTER,
				category: ActivityCategory.AUTH,
				resourceType: 'user',
				resourceId: userId,
				success: true,
				metadata: {
					username: String(username),
					email: String(email)
				},
				message: `New user registered: ${username}`
			});

			// Assign default user role
			await PermissionService.assignRole(userId, SYSTEM_ROLES.USER.id);

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch (err) {
			console.error('Error creating user:', err);

			// Log registration failure
			await ActivityLogService.logFailure(
				ActivityActions.REGISTER,
				ActivityCategory.AUTH,
				String(err),
				{
					ipAddress: clientIP,
					metadata: {
						username: String(username),
						email: String(email)
					},
					message: 'Failed to create user account'
				}
			);

			return fail(500, {
				message: 'An error has occurred',
				username: String(username || ''),
				email: String(email || ''),
				firstName: String(firstName || ''),
				lastName: String(lastName || '')
			});
		}
		return redirect(302, '/panel');
	}
};
