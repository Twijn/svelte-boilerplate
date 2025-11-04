import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase, encodeBase32LowerCase } from '@oslojs/encoding';
import { sendEmail, getPasswordResetEmail, getPasswordChangedEmail } from '$lib/server/email';
import { env } from '$env/dynamic/private';

const RESET_TOKEN_EXPIRES_IN = 1000 * 60 * 60; // 1 hour

export function generatePasswordResetToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(25));
	const token = encodeBase32LowerCase(bytes);
	return token;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
	// Delete any existing tokens for this user
	await db.delete(table.passwordResetToken).where(eq(table.passwordResetToken.userId, userId));

	const token = generatePasswordResetToken();
	const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const tokenId = generateTokenId();
	await db.insert(table.passwordResetToken).values({
		id: tokenId,
		userId,
		tokenHash,
		expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRES_IN)
	});

	return token;
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
	const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const [result] = await db
		.select()
		.from(table.passwordResetToken)
		.where(eq(table.passwordResetToken.tokenHash, tokenHash));

	if (!result) {
		return null;
	}

	// Check if token has expired
	if (Date.now() >= result.expiresAt.getTime()) {
		await db.delete(table.passwordResetToken).where(eq(table.passwordResetToken.id, result.id));
		return null;
	}

	return result.userId;
}

export async function deletePasswordResetToken(token: string): Promise<void> {
	const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	await db
		.delete(table.passwordResetToken)
		.where(eq(table.passwordResetToken.tokenHash, tokenHash));
}

export async function sendPasswordResetEmail(email: string): Promise<boolean> {
	// Find user by email
	const [user] = await db.select().from(table.user).where(eq(table.user.email, email));

	if (!user) {
		// Don't reveal that the email doesn't exist (security best practice)
		return true;
	}

	// Create reset token
	const token = await createPasswordResetToken(user.id);

	// Generate reset link
	const baseUrl = env.PUBLIC_BASE_URL || 'http://localhost:5173';
	const resetLink = `${baseUrl}/reset-password?token=${token}`;

	// Send email
	try {
		const emailHtml = getPasswordResetEmail(resetLink, user.firstName);
		await sendEmail({
			to: user.email,
			subject: 'Password Reset Request',
			html: emailHtml
		});
		return true;
	} catch (error) {
		console.error('Failed to send password reset email:', error);
		throw error;
	}
}

export async function sendPasswordChangedNotification(userId: string): Promise<void> {
	const [user] = await db.select().from(table.user).where(eq(table.user.id, userId));

	if (!user) {
		return;
	}

	try {
		const emailHtml = getPasswordChangedEmail(user.firstName);
		await sendEmail({
			to: user.email,
			subject: 'Password Changed Successfully',
			html: emailHtml
		});
	} catch (error) {
		console.error('Failed to send password changed notification:', error);
		// Don't throw - this is just a notification
	}
}

function generateTokenId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase32LowerCase(bytes);
}
