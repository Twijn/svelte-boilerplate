import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import { permissionHandle } from '$lib/server/permission-middleware';
import { dev } from '$app/environment';
import { initializeConfigSystem } from '$lib/server/config';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';

// Initialize configuration system on server startup
initializeConfigSystem();

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

const handlePasswordChange: Handle = async ({ event, resolve }) => {
	const user = event.locals.user;
	const path = event.url.pathname;

	// If user is logged in and needs to change password
	if (user?.requirePasswordChange) {
		// Allow access to password change page, logout, and static assets
		const allowedPaths = [
			'/panel/profile/password',
			'/logout',
			'/api/' // API endpoints if needed
		];

		const isAllowed =
			allowedPaths.some((allowed) => path.startsWith(allowed)) ||
			path.startsWith('/_app/') || // SvelteKit internal
			path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/); // Static files

		if (!isAllowed) {
			// Redirect to password change page
			return new Response(null, {
				status: 302,
				headers: {
					location: '/panel/profile/password?required=true'
				}
			});
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleAuth, handlePasswordChange, permissionHandle);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	// Log full error details on server
	console.error('═══════════════════════════════════════════════════════════════');
	console.error(`🔴 Error ID: ${errorId}`);
	console.error(`📍 URL: ${event.url.pathname}`);
	console.error(`🔢 Status: ${status}`);
	console.error(`💬 Message: ${message}`);
	console.error(`👤 User: ${event.locals.user?.id || 'Anonymous'}`);
	console.error(`🕐 Time: ${new Date().toISOString()}`);

	if (error instanceof Error) {
		console.error(`📝 Error Name: ${error.name}`);
		console.error(`📄 Error Message: ${error.message}`);
		console.error(`📚 Stack Trace:\n${error.stack}`);
	} else {
		console.error(`📄 Error Details:`, error);
	}
	console.error('═══════════════════════════════════════════════════════════════');

	// Log 500 errors to activity log for monitoring
	if (status >= 500 && event.locals.user) {
		try {
			await ActivityLogService.log({
				userId: event.locals.user.id,
				action: 'system.error' as const,
				category: ActivityCategory.SYSTEM,
				metadata: {
					errorId,
					status,
					message,
					url: event.url.pathname,
					userAgent: event.request.headers.get('user-agent')
				},
				ipAddress: event.getClientAddress()
			});
		} catch (logError) {
			// Don't fail the error handler if logging fails
			console.error('Failed to log error to activity log:', logError);
		}
	}

	// Return slightly more verbose error to client
	return {
		message: dev
			? `${message} (Error ID: ${errorId})`
			: `An error occurred. Reference ID: ${errorId}`,
		errorId
	};
};
