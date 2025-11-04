import { fail, redirect } from '@sveltejs/kit';
import { validateEmail } from '$lib/server/auth';
import { sendPasswordResetEmail } from '$lib/server/password-reset';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already logged in, redirect to home
	if (locals.user) {
		return redirect(302, '/panel');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (!validateEmail(email)) {
			return fail(400, {
				error: 'Please enter a valid email address',
				email: typeof email === 'string' ? email : ''
			});
		}

		try {
			await sendPasswordResetEmail(email);

			// Always return success to prevent email enumeration
			return {
				success: true,
				message:
					'If an account exists with that email, you will receive a password reset link shortly.'
			};
		} catch (error) {
			console.error('Password reset error:', error);
			return fail(500, {
				error: 'Failed to send password reset email. Please try again later.',
				email: typeof email === 'string' ? email : ''
			});
		}
	}
};
