import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import { permissionHandle } from '$lib/server/permission-middleware';
import { dev } from '$app/environment';

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

export const handle: Handle = sequence(handleAuth, permissionHandle);

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

	// Return slightly more verbose error to client
	return {
		message: dev
			? `${message} (Error ID: ${errorId})`
			: `An error occurred. Reference ID: ${errorId}`,
		errorId
	};
};
