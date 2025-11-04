import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';
import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { verify } from '@node-rs/argon2';
import { RateLimitService, AccountLockoutService } from '$lib/server/rate-limit';
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/panel');
	}
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		// Get client IP for rate limiting
		const clientIP =
			event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
			event.getClientAddress();

		// Check rate limit for this IP
		const rateLimitCheck = await RateLimitService.checkRateLimit(clientIP, 'login');
		if (!rateLimitCheck.allowed) {
			const minutes = Math.ceil((rateLimitCheck.retryAfter || 60) / 60);
			return fail(429, {
				message: `Too many login attempts from this IP address. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
				username: String(username)
			});
		}

		// Record this attempt
		await RateLimitService.recordAttempt(clientIP, 'login');

		if (!auth.validateUsername(username)) {
			return fail(400, {
				message: 'Invalid username (min 3, max 31 characters, alphanumeric only)',
				username: String(username)
			});
		}
		if (!auth.validatePassword(password)) {
			return fail(400, {
				message: 'Invalid password (min 6, max 255 characters)',
				username: String(username)
			});
		}
		const results = await db.select().from(table.user).where(eq(table.user.username, username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return fail(400, {
				message: 'Incorrect username or password',
				username: String(username)
			});
		}

		// Check if account is locked
		const lockoutStatus = await AccountLockoutService.isAccountLocked(existingUser.id);
		if (lockoutStatus.locked) {
			if (lockoutStatus.lockedUntil) {
				const minutesRemaining = Math.ceil(
					(lockoutStatus.lockedUntil.getTime() - Date.now()) / 60000
				);
				return fail(403, {
					message: `Account temporarily locked due to too many failed login attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
					username: String(username)
				});
			}
			return fail(403, {
				message: 'Account has been locked. Please contact an administrator.',
				username: String(username)
			});
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			// Log failed login attempt
			await ActivityLogService.log({
				userId: existingUser.id,
				ipAddress: clientIP,
				userAgent: event.request.headers.get('user-agent'),
				action: ActivityActions.LOGIN_FAILED,
				category: ActivityCategory.AUTH,
				resourceType: 'user',
				resourceId: existingUser.id,
				success: false,
				message: `Failed login attempt for user: ${username}`
			});

			// Record failed login attempt
			const lockoutResult = await AccountLockoutService.recordFailedLogin(existingUser.id);

			if (lockoutResult.locked) {
				return fail(403, {
					message:
						'Too many failed login attempts. Your account has been temporarily locked for 5 minutes.',
					username: String(username)
				});
			}

			return fail(400, {
				message: `Incorrect username or password. ${lockoutResult.attemptsRemaining} attempt${lockoutResult.attemptsRemaining !== 1 ? 's' : ''} remaining before account lockout.`,
				username: String(username)
			});
		}

		// Successful login - clear failed attempts
		await AccountLockoutService.clearFailedAttempts(existingUser.id);

		// Check if 2FA is enabled
		if (existingUser.twoFactorEnabled) {
			// Store user ID in a temporary cookie for 2FA verification
			event.cookies.set('2fa_pending_user_id', existingUser.id, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 5 // 5 minutes
			});

			// Log 2FA challenge
			await ActivityLogService.log({
				userId: existingUser.id,
				ipAddress: clientIP,
				userAgent: event.request.headers.get('user-agent'),
				action: 'user.2fa.challenge',
				category: ActivityCategory.AUTH,
				resourceType: 'user',
				resourceId: existingUser.id,
				success: true,
				message: `2FA challenge initiated for user: ${username}`
			});

			return redirect(302, '/login/verify-2fa');
		}

		// Log successful login (no 2FA)
		await ActivityLogService.log({
			userId: existingUser.id,
			ipAddress: clientIP,
			userAgent: event.request.headers.get('user-agent'),
			action: ActivityActions.LOGIN,
			category: ActivityCategory.AUTH,
			resourceType: 'user',
			resourceId: existingUser.id,
			success: true,
			message: `Successful login for user: ${username}`
		});

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, '/panel');
	}
};
