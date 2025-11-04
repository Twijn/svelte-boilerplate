import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { verifyTOTP, verifyBackupCode } from '$lib/server/two-factor';
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

export const load: PageServerLoad = async (event) => {
	// Check if user already logged in
	if (event.locals.user) {
		return redirect(302, '/panel');
	}

	// Check if 2FA verification is pending
	const pendingUserId = event.cookies.get('2fa_pending_user_id');
	if (!pendingUserId) {
		return redirect(302, '/login');
	}

	return {};
};

export const actions: Actions = {
	verify: async (event) => {
		const pendingUserId = event.cookies.get('2fa_pending_user_id');
		if (!pendingUserId) {
			return fail(401, {
				message: 'No pending 2FA verification. Please login again.',
				type: 'error'
			});
		}

		const formData = await event.request.formData();
		const totpCode = formData.get('totpCode') as string;

		const clientIP =
			event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
			event.getClientAddress();

		if (!totpCode || totpCode.length !== 6) {
			return fail(400, {
				message: 'Invalid verification code format',
				type: 'error'
			});
		}

		// Fetch user
		const users = await db.select().from(table.user).where(eq(table.user.id, pendingUserId));
		if (users.length === 0) {
			console.error('2FA verification: User not found for ID:', pendingUserId);
			event.cookies.delete('2fa_pending_user_id', { path: '/' });
			return fail(404, {
				message: 'User not found',
				type: 'error'
			});
		}

		const user = users[0];

		if (!user.twoFactorEnabled || !user.twoFactorSecret) {
			console.error('2FA verification: 2FA not enabled for user:', user.id);
			event.cookies.delete('2fa_pending_user_id', { path: '/' });
			return fail(400, {
				message: '2FA is not enabled for this account',
				type: 'error'
			});
		}

		console.log('Verifying TOTP code for user:', user.id);
		// Verify TOTP code
		const isValid = verifyTOTP(totpCode, user.twoFactorSecret);
		console.log('TOTP verification result:', isValid);

		if (!isValid) {
			// Log failed verification
			await ActivityLogService.log({
				userId: user.id,
				ipAddress: clientIP,
				userAgent: event.request.headers.get('user-agent'),
				action: 'user.2fa.verify.failed',
				category: ActivityCategory.AUTH,
				resourceType: 'user',
				resourceId: user.id,
				success: false,
				message: `Failed 2FA verification attempt`
			});

			return fail(400, {
				message: 'Invalid verification code. Please try again.',
				type: 'error'
			});
		}

		// Clear pending cookie
		event.cookies.delete('2fa_pending_user_id', { path: '/' });

		// Log successful 2FA verification
		await ActivityLogService.log({
			userId: user.id,
			ipAddress: clientIP,
			userAgent: event.request.headers.get('user-agent'),
			action: ActivityActions.LOGIN,
			category: ActivityCategory.AUTH,
			resourceType: 'user',
			resourceId: user.id,
			success: true,
			message: `Successful 2FA verification for user: ${user.username}`
		});

		// Create session
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, user.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		throw redirect(302, '/panel');
	},

	useBackupCode: async (event) => {
		const pendingUserId = event.cookies.get('2fa_pending_user_id');
		if (!pendingUserId) {
			return fail(401, {
				message: 'No pending 2FA verification. Please login again.',
				type: 'error'
			});
		}

		const formData = await event.request.formData();
		const backupCode = formData.get('backupCode') as string;

		const clientIP =
			event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
			event.getClientAddress();

		if (!backupCode) {
			return fail(400, {
				message: 'Backup code is required',
				type: 'error'
			});
		}

		// Fetch user
		const users = await db.select().from(table.user).where(eq(table.user.id, pendingUserId));
		if (users.length === 0) {
			event.cookies.delete('2fa_pending_user_id', { path: '/' });
			return fail(404, {
				message: 'User not found',
				type: 'error'
			});
		}

		const user = users[0];

		if (!user.twoFactorEnabled || !user.twoFactorBackupCodes) {
			event.cookies.delete('2fa_pending_user_id', { path: '/' });
			return fail(400, {
				message: '2FA is not enabled for this account',
				type: 'error'
			});
		}

		// Remove all formatting from backup code
		const cleanCode = backupCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();

		// Verify backup code
		const codeIndex = await verifyBackupCode(cleanCode, user.twoFactorBackupCodes);

		if (codeIndex < 0) {
			// Log failed backup code attempt
			await ActivityLogService.log({
				userId: user.id,
				ipAddress: clientIP,
				userAgent: event.request.headers.get('user-agent'),
				action: 'user.2fa.backup.failed',
				category: ActivityCategory.AUTH,
				resourceType: 'user',
				resourceId: user.id,
				success: false,
				message: `Failed backup code verification attempt`
			});

			return fail(400, {
				message: 'Invalid backup code. Please try again.',
				type: 'error'
			});
		}

		// Remove used backup code
		const remainingCodes = [...user.twoFactorBackupCodes];
		remainingCodes.splice(codeIndex, 1);

		await db
			.update(table.user)
			.set({
				twoFactorBackupCodes: remainingCodes.length > 0 ? remainingCodes : null,
				updatedAt: new Date()
			})
			.where(eq(table.user.id, user.id));

		// Clear pending cookie
		event.cookies.delete('2fa_pending_user_id', { path: '/' });

		// Log successful backup code use
		await ActivityLogService.log({
			userId: user.id,
			ipAddress: clientIP,
			userAgent: event.request.headers.get('user-agent'),
			action: ActivityActions.LOGIN,
			category: ActivityCategory.AUTH,
			resourceType: 'user',
			resourceId: user.id,
			success: true,
			message: `Successful login using backup code. ${remainingCodes.length} backup codes remaining.`,
			metadata: {
				backupCodesRemaining: remainingCodes.length
			}
		});

		// Create session
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, user.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		// Show warning if running low on backup codes
		if (remainingCodes.length <= 2 && remainingCodes.length > 0) {
			throw redirect(
				302,
				`/panel?warning=You have ${remainingCodes.length} backup code${remainingCodes.length !== 1 ? 's' : ''} remaining. Consider regenerating them.`
			);
		}

		throw redirect(302, '/panel');
	}
};
