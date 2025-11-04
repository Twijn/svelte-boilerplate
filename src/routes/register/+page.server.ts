import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { PermissionService, SYSTEM_ROLES } from '$lib/server/permissions';

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

			// Assign default user role
			await PermissionService.assignRole(userId, SYSTEM_ROLES.USER.id);

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch (err) {
			console.error('Error creating user:', err);
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
