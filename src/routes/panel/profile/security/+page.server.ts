import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import {
	generateTOTPSecret,
	generateTOTPUri,
	generateQRCode,
	verifyTOTP,
	generateBackupCodes,
	hashBackupCodes
} from '$lib/server/two-factor';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';

export const load: PageServerLoad = async ({ parent, url }) => {
	const parentData = await parent();

	// Fetch fresh user data with 2FA fields
	const users = await db.select().from(table.user).where(eq(table.user.id, parentData.user.id));

	const user = users[0];

	// Check if we should show 2FA setup (after enabling)
	const show2FASetup = url.searchParams.get('setup2fa') === 'true';

	// Return 2FA setup data if needed
	if (show2FASetup && user.twoFactorSecret && !user.twoFactorEnabled) {
		const uri = generateTOTPUri(user.twoFactorSecret, user.email);
		const qrCode = await generateQRCode(uri);

		// Generate backup codes (plain text for display)
		const backupCodes = generateBackupCodes(10);

		return {
			user,
			qrCode,
			totpSecret: user.twoFactorSecret,
			backupCodes
		};
	}

	return {
		user
	};
};

export const actions: Actions = {
	enable2FA: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const password = formData.get('password') as string;

		if (!password) {
			return fail(400, {
				message: 'Password is required',
				success: false
			});
		}

		try {
			// Verify password
			const users = await db.select().from(table.user).where(eq(table.user.id, locals.user.id));
			if (users.length === 0) {
				return fail(404, { message: 'User not found', success: false });
			}

			const user = users[0];
			const validPassword = await verify(user.passwordHash, password);
			if (!validPassword) {
				return fail(400, {
					message: 'Incorrect password',
					success: false
				});
			}

			// Check if 2FA is already enabled
			if (user.twoFactorEnabled) {
				return fail(400, {
					message: '2FA is already enabled',
					success: false
				});
			}

			// Generate new TOTP secret
			const secret = generateTOTPSecret();

			// Save secret to database (not enabled yet)
			await db
				.update(table.user)
				.set({
					twoFactorSecret: secret,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.2fa.setup.start',
				category: ActivityCategory.AUTH,
				message: 'User started 2FA setup',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			// Return success with redirect flag
			return {
				success: true,
				message: 'Scan the QR code with your authenticator app',
				action: 'enable2FA',
				redirect: '/panel/profile/security?setup2fa=true'
			};
		} catch (error) {
			console.error('2FA enable error:', error);
			return fail(500, {
				message: 'Failed to enable 2FA',
				success: false
			});
		}
	},

	verify2FA: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const totpCode = formData.get('totpCode') as string;
		const backupCodesStr = formData.get('backupCodes') as string;

		if (!totpCode) {
			return fail(400, {
				message: 'Verification code is required',
				success: false
			});
		}

		// Clean the TOTP code (remove spaces, dashes, etc.)
		const cleanedCode = totpCode.replace(/\s|-/g, '');

		if (cleanedCode.length !== 6) {
			return fail(400, {
				message: 'Invalid verification code',
				success: false
			});
		}

		try {
			// Fetch user with secret
			const users = await db.select().from(table.user).where(eq(table.user.id, locals.user.id));
			if (users.length === 0) {
				return fail(404, { message: 'User not found', success: false });
			}

			const user = users[0];

			if (!user.twoFactorSecret) {
				return fail(400, {
					message: '2FA setup not started',
					success: false
				});
			}

			// Verify TOTP code with a wider window during setup (±2 periods = ±60 seconds)
			const isValid = verifyTOTP(cleanedCode, user.twoFactorSecret, 2);
			if (!isValid) {
				return fail(400, {
					message:
						'Invalid verification code. Please ensure your device time is synchronized and try again.',
					success: false,
					action: 'verify2FA'
				});
			}

			// Get backup codes from form data
			let hashedBackupCodes: string[] | null = null;

			if (backupCodesStr) {
				try {
					const backupCodes = JSON.parse(backupCodesStr);
					hashedBackupCodes = await hashBackupCodes(backupCodes);
				} catch {
					// Generate new backup codes if parsing fails
					const backupCodes = generateBackupCodes(10);
					hashedBackupCodes = await hashBackupCodes(backupCodes);
				}
			} else {
				// Generate backup codes
				const backupCodes = generateBackupCodes(10);
				hashedBackupCodes = await hashBackupCodes(backupCodes);
			}

			// Enable 2FA
			await db
				.update(table.user)
				.set({
					twoFactorEnabled: true,
					twoFactorBackupCodes: hashedBackupCodes,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.2fa.enable',
				category: ActivityCategory.AUTH,
				message: 'User enabled 2FA',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			return {
				success: true,
				message: '2FA has been enabled successfully',
				action: 'verify2FA'
			};
		} catch (error) {
			console.error('2FA verification error:', error);
			return fail(500, {
				message: 'Failed to verify 2FA',
				success: false
			});
		}
	},

	disable2FA: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const password = formData.get('password') as string;

		if (!password) {
			return fail(400, {
				message: 'Password is required',
				success: false
			});
		}

		try {
			// Verify password
			const users = await db.select().from(table.user).where(eq(table.user.id, locals.user.id));
			if (users.length === 0) {
				return fail(404, { message: 'User not found', success: false });
			}

			const user = users[0];
			const validPassword = await verify(user.passwordHash, password);
			if (!validPassword) {
				return fail(400, {
					message: 'Incorrect password',
					success: false
				});
			}

			// Check if 2FA is enabled
			if (!user.twoFactorEnabled) {
				return fail(400, {
					message: '2FA is not enabled',
					success: false
				});
			}

			// Disable 2FA
			await db
				.update(table.user)
				.set({
					twoFactorEnabled: false,
					twoFactorSecret: null,
					twoFactorBackupCodes: null,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.2fa.disable',
				category: ActivityCategory.AUTH,
				message: 'User disabled 2FA',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			return {
				success: true,
				message: '2FA has been disabled',
				action: 'disable2FA'
			};
		} catch (error) {
			console.error('2FA disable error:', error);
			return fail(500, {
				message: 'Failed to disable 2FA',
				success: false
			});
		}
	}
};
