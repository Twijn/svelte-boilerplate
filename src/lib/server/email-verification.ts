import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import { sendEmail } from '$lib/server/email';
import { APP_NAME } from '$lib/consts';

/**
 * Generate a secure random token for email verification
 */
function generateToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

/**
 * Hash a token for storage in the database
 */
async function hashToken(token: string): Promise<string> {
	return await hash(token, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

/**
 * Create and send an email verification token
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
	// Delete any existing verification tokens for this user
	await db
		.delete(table.emailVerificationToken)
		.where(eq(table.emailVerificationToken.userId, userId));

	// Generate new token
	const token = generateToken();
	const tokenHash = await hashToken(token);

	// Store in database (expires in 24 hours)
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + 24);

	await db.insert(table.emailVerificationToken).values({
		id: crypto.randomUUID(),
		userId,
		tokenHash,
		expiresAt
	});

	return token;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
	email: string,
	token: string,
	origin: string
): Promise<void> {
	const verificationUrl = `${origin}/verify-email?token=${token}`;

	await sendEmail({
		to: email,
		subject: `Verify your email for ${APP_NAME}`,
		text: `
Hello,

Thank you for signing up for ${APP_NAME}!

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The ${APP_NAME} Team
		`.trim(),
		html: `
<!DOCTYPE html>
<html>
<head>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.button { 
			display: inline-block; 
			padding: 12px 24px; 
			background-color: #007bff; 
			color: white !important; 
			text-decoration: none; 
			border-radius: 5px; 
			margin: 20px 0;
		}
		.footer { margin-top: 30px; font-size: 0.9em; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<h2>Verify Your Email Address</h2>
		<p>Hello,</p>
		<p>Thank you for signing up for ${APP_NAME}!</p>
		<p>Please verify your email address by clicking the button below:</p>
		<a href="${verificationUrl}" class="button">Verify Email Address</a>
		<p>Or copy and paste this link into your browser:</p>
		<p style="word-break: break-all; color: #666;">${verificationUrl}</p>
		<p class="footer">
			This link will expire in 24 hours.<br>
			If you didn't create an account, you can safely ignore this email.
		</p>
		<p class="footer">
			Best regards,<br>
			The ${APP_NAME} Team
		</p>
	</div>
</body>
</html>
		`.trim()
	});
}

/**
 * Verify an email verification token and mark user as verified
 */
export async function verifyEmailToken(
	token: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
	// Get all non-expired tokens and check each one
	const allTokens = await db
		.select()
		.from(table.emailVerificationToken)
		.where(eq(table.emailVerificationToken.expiresAt, table.emailVerificationToken.expiresAt));

	let verificationToken = null;

	// Find matching token by verifying the hash
	for (const dbToken of allTokens) {
		try {
			const { verify } = await import('@node-rs/argon2');
			const isValid = await verify(dbToken.tokenHash, token);
			if (isValid) {
				verificationToken = dbToken;
				break;
			}
		} catch {
			// Token verification failed, continue to next
			continue;
		}
	}

	if (!verificationToken) {
		return { success: false, error: 'Invalid or expired verification token' };
	}

	// Check if expired
	if (new Date() > verificationToken.expiresAt) {
		// Clean up expired token
		await db
			.delete(table.emailVerificationToken)
			.where(eq(table.emailVerificationToken.id, verificationToken.id));
		return { success: false, error: 'Verification token has expired' };
	}

	// Mark user as verified
	await db
		.update(table.user)
		.set({
			emailVerified: true,
			emailVerifiedAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(table.user.id, verificationToken.userId));

	// Delete the used token
	await db
		.delete(table.emailVerificationToken)
		.where(eq(table.emailVerificationToken.id, verificationToken.id));

	return { success: true, userId: verificationToken.userId };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
	userId: string,
	origin: string
): Promise<{ success: boolean; error?: string }> {
	// Get user
	const users = await db.select().from(table.user).where(eq(table.user.id, userId));

	if (users.length === 0) {
		return { success: false, error: 'User not found' };
	}

	const user = users[0];

	if (user.emailVerified) {
		return { success: false, error: 'Email already verified' };
	}

	// Create and send new token
	const token = await createEmailVerificationToken(userId);
	await sendVerificationEmail(user.email, token, origin);

	return { success: true };
}
