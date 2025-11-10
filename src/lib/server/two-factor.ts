import { Secret, TOTP } from 'otpauth';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { hash, verify } from '@node-rs/argon2';
import { getConfig } from '$lib/server/config';
import { APP_NAME } from '$lib/consts';

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(): string {
	const secret = new Secret({ size: 20 });
	return secret.base32;
}

/**
 * Generate a TOTP URI for QR code generation
 */
export function generateTOTPUri(secret: string, email: string): string {
	const totp = new TOTP({
		issuer: APP_NAME,
		label: email,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: Secret.fromBase32(secret)
	});

	return totp.toString();
}

/**
 * Generate a QR code data URL from a TOTP URI
 */
export async function generateQRCode(uri: string): Promise<string> {
	try {
		return await QRCode.toDataURL(uri, {
			errorCorrectionLevel: 'M',
			width: 300,
			margin: 2
		});
	} catch (error) {
		console.error('Failed to generate QR code:', error);
		throw new Error('Failed to generate QR code');
	}
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTOTP(token: string, secret: string, window: number = 2): boolean {
	try {
		const totp = new TOTP({
			issuer: APP_NAME,
			algorithm: 'SHA1',
			digits: 6,
			period: 30,
			secret: Secret.fromBase32(secret)
		});

		// Validate the token with a configurable window (default ±2 periods = ±60 seconds)
		// This helps account for clock drift between server and client
		const delta = totp.validate({
			token,
			window
		});

		return delta !== null;
	} catch (error) {
		console.error('Failed to verify TOTP:', error);
		return false;
	}
}

/**
 * Generate backup codes for 2FA recovery
 * Returns an array of plain text backup codes
 */
export async function generateBackupCodes(count?: number): Promise<string[]> {
	// Get count from config if not provided
	if (count === undefined) {
		count = await getConfig<number>('security.2fa.backup_codes_count');
	}

	const codes: string[] = [];

	for (let i = 0; i < count; i++) {
		// Generate 6 random bytes (12 hex chars) to get XXXX-XXXX-XXXX format
		const code =
			randomBytes(6)
				.toString('hex')
				.toUpperCase()
				.match(/.{1,4}/g)
				?.join('-') || '';
		codes.push(code);
	}

	return codes;
}

/**
 * Hash backup codes for storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
	const hashedCodes: string[] = [];

	for (const code of codes) {
		const hashed = await hash(code, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		hashedCodes.push(hashed);
	}

	return hashedCodes;
}

/**
 * Verify a backup code against stored hashed codes
 * Returns the index of the matched code, or -1 if no match
 */
export async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
	for (let i = 0; i < hashedCodes.length; i++) {
		try {
			const isValid = await verify(hashedCodes[i], code);
			if (isValid) {
				return i;
			}
		} catch {
			// Continue checking other codes if one fails to verify
			continue;
		}
	}

	return -1;
}

/**
 * Format backup codes for display (add dashes every 4 characters)
 */
export function formatBackupCode(code: string): string {
	return code.match(/.{1,4}/g)?.join('-') || code;
}
