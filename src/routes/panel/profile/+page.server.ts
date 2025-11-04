import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify, hash } from '@node-rs/argon2';
import {
	validateUsername,
	validateEmail,
	validatePassword,
	invalidateUserSessions
} from '$lib/server/auth';
import { saveUploadedFile, getFileFromFormData, deleteUploadedFile } from '$lib/server/file-upload';
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';
import {
	generateTOTPSecret,
	generateTOTPUri,
	generateQRCode,
	verifyTOTP,
	generateBackupCodes,
	hashBackupCodes
} from '$lib/server/two-factor';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	// Fetch fresh user data including new profile fields
	const users = await db.select().from(table.user).where(eq(table.user.id, locals.user.id));

	if (users.length === 0) {
		return redirect(302, '/login');
	}

	const user = users[0];

	// Check if we should show 2FA setup (after enabling)
	const show2FASetup = url.searchParams.get('setup2fa') === 'true';

	// Return 2FA setup data if needed
	if (show2FASetup && user.twoFactorSecret && !user.twoFactorEnabled) {
		const uri = generateTOTPUri(user.twoFactorSecret, user.email);
		const qrCode = await generateQRCode(uri);

		// Generate backup codes (plain text for display)
		const backupCodes = generateBackupCodes(10);

		// Store them temporarily in the return (they'll be hashed on verify)
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
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;
		const username = formData.get('username') as string;
		const bio = formData.get('bio') as string;
		const location = formData.get('location') as string;
		const website = formData.get('website') as string;
		const avatarFile = getFileFromFormData(formData, 'avatar');
		const deleteAvatarFlag = formData.get('deleteAvatar') === 'true';

		// Validate required fields
		if (!firstName || !lastName || !username) {
			return fail(400, {
				message: 'First name, last name, and username are required',
				success: false
			});
		}

		// Validate username format
		if (!validateUsername(username)) {
			return fail(400, {
				message: 'Invalid username format',
				success: false
			});
		}

		// Validate website URL if provided
		if (website) {
			try {
				new URL(website);
			} catch {
				return fail(400, {
					message: 'Invalid website URL format',
					success: false
				});
			}
		}

		try {
			// Check if username is taken by another user
			if (username !== locals.user.username) {
				const existingUser = await db
					.select()
					.from(table.user)
					.where(eq(table.user.username, username));

				if (existingUser.length > 0 && existingUser[0].id !== locals.user.id) {
					return fail(400, {
						message: 'Username already taken',
						success: false
					});
				}
			}

			let avatarUrl = locals.user.avatar;

			// Handle avatar deletion
			if (deleteAvatarFlag) {
				if (locals.user.avatar) {
					await deleteUploadedFile(locals.user.avatar);
				}
				avatarUrl = null;
			}
			// Handle avatar upload
			else if (avatarFile) {
				const uploadResult = await saveUploadedFile(avatarFile, 'uploads/avatars');

				if (!uploadResult.success) {
					return fail(400, {
						message: uploadResult.error || 'Failed to upload avatar',
						success: false
					});
				}

				// Delete old avatar if it exists
				if (locals.user.avatar) {
					await deleteUploadedFile(locals.user.avatar);
				}

				avatarUrl = uploadResult.url || null;
			}

			// Update user profile
			await db
				.update(table.user)
				.set({
					firstName,
					lastName,
					username,
					bio: bio || null,
					location: location || null,
					website: website || null,
					avatar: avatarUrl,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: ActivityActions.USER_UPDATE,
				category: ActivityCategory.USER,
				message: 'User updated their profile',
				resourceType: 'user',
				resourceId: locals.user.id,
				metadata: {
					fields: [
						'firstName',
						'lastName',
						'username',
						'bio',
						'location',
						'website',
						'avatar'
					].filter((field) => formData.has(field))
				}
			});

			return {
				success: true,
				message: 'Profile updated successfully',
				action: 'updateProfile'
			};
		} catch (error) {
			console.error('Profile update error:', error);
			return fail(500, {
				message: 'Failed to update profile',
				success: false
			});
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword') as string;
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		// Validate inputs
		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, {
				message: 'All fields are required',
				success: false
			});
		}

		if (newPassword !== confirmPassword) {
			return fail(400, {
				message: 'New passwords do not match',
				success: false
			});
		}

		if (!validatePassword(newPassword)) {
			return fail(400, {
				message: 'New password must be at least 6 characters',
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

			// Verify current password
			const validPassword = await verify(user.passwordHash, currentPassword);
			if (!validPassword) {
				return fail(400, {
					message: 'Current password is incorrect',
					success: false
				});
			}

			// Hash new password
			const newPasswordHash = await hash(newPassword);

			// Update password
			await db
				.update(table.user)
				.set({
					passwordHash: newPasswordHash,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Invalidate all sessions except current one (force re-login on other devices)
			await invalidateUserSessions(locals.user.id, locals.session?.id);

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: ActivityActions.PASSWORD_CHANGE,
				category: ActivityCategory.AUTH,
				message: 'User changed their password',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			return {
				success: true,
				message: 'Password changed successfully. Other sessions have been logged out.',
				action: 'changePassword'
			};
		} catch (error) {
			console.error('Password change error:', error);
			return fail(500, {
				message: 'Failed to change password',
				success: false
			});
		}
	},

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
	},

	deleteAccount: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		try {
			// Delete avatar file if it exists
			if (locals.user.avatar) {
				await deleteUploadedFile(locals.user.avatar);
			}

			// Log activity before deletion
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.account.delete',
				category: ActivityCategory.USER,
				message: 'User deleted their account',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			// Delete user (cascades to sessions, roles, etc.)
			await db.delete(table.user).where(eq(table.user.id, locals.user.id));

			// Redirect to home page after deletion
			return redirect(302, '/');
		} catch (error) {
			console.error('Account deletion error:', error);
			return fail(500, {
				message: 'Failed to delete account',
				success: false
			});
		}
	},

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
				redirect: '/panel/profile?setup2fa=true'
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

		if (!totpCode || totpCode.length !== 6) {
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

			// Verify TOTP code
			const isValid = verifyTOTP(totpCode, user.twoFactorSecret);
			if (!isValid) {
				return fail(400, {
					message: 'Invalid verification code. Please try again.',
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
