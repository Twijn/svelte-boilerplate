import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateUsername } from '$lib/server/auth';
import { saveUploadedFile, getFileFromFormData, deleteUploadedFile } from '$lib/server/file-upload';
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

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
	}
};
