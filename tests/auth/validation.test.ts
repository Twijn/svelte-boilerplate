import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
	validatePasswordRequirements,
	validateEmail,
	validateUsername,
	validateFirstOrLastName,
	validatePassword
} from '$lib/server/auth';
import * as configModule from '$lib/server/config';

// Mock the config module
vi.mock('$lib/server/config', () => ({
	getConfig: vi.fn()
}));

describe('Authentication Utilities', () => {
	beforeAll(() => {
		// Setup default config values
		vi.mocked(configModule.getConfig).mockImplementation(async (key: string) => {
			const configs: Record<string, number | boolean> = {
				'security.password.min_length': 8,
				'security.password.require_uppercase': true,
				'security.password.require_lowercase': true,
				'security.password.require_number': true,
				'security.password.require_special': true
			};
			return configs[key];
		});
	});

	describe('validatePasswordRequirements', () => {
		it('should accept valid passwords meeting all requirements', async () => {
			const validPasswords = ['Admin123!', 'Test@1234', 'MyP@ssw0rd', 'Secure#Pass1'];

			for (const password of validPasswords) {
				const result = await validatePasswordRequirements(password);
				expect(result).toBeNull();
			}
		});

		it('should reject passwords that are too short', async () => {
			const result = await validatePasswordRequirements('Test1!');
			expect(result).toBe('Password must be at least 8 characters long');
		});

		it('should reject passwords without uppercase letters', async () => {
			const result = await validatePasswordRequirements('test123!');
			expect(result).toBe('Password must contain at least one uppercase letter');
		});

		it('should reject passwords without lowercase letters', async () => {
			const result = await validatePasswordRequirements('TEST123!');
			expect(result).toBe('Password must contain at least one lowercase letter');
		});

		it('should reject passwords without numbers', async () => {
			const result = await validatePasswordRequirements('TestPass!');
			expect(result).toBe('Password must contain at least one number');
		});

		it('should reject passwords without special characters', async () => {
			const result = await validatePasswordRequirements('TestPass1');
			expect(result).toBe('Password must contain at least one special character');
		});

		it('should reject passwords that are too long', async () => {
			const longPassword = 'A'.repeat(256) + '1!';
			const result = await validatePasswordRequirements(longPassword);
			expect(result).toBe('Password cannot exceed 255 characters');
		});

		it('should handle edge case of exactly 8 characters', async () => {
			const result = await validatePasswordRequirements('Test123!');
			expect(result).toBeNull();
		});
	});

	describe('validateEmail', () => {
		it('should accept valid email addresses', () => {
			const validEmails = [
				'test@example.com',
				'user.name@domain.co.uk',
				'admin+tag@site.org',
				'info@sub.domain.com'
			];

			validEmails.forEach((email) => {
				expect(validateEmail(email)).toBe(true);
			});
		});

		it('should reject invalid email addresses', () => {
			const invalidEmails = [
				'invalid',
				'@example.com',
				'user@',
				'user @example.com',
				'user@domain',
				'',
				'a@' // Too short
			];

			invalidEmails.forEach((email) => {
				expect(validateEmail(email)).toBe(false);
			});
		});

		it('should reject non-string inputs', () => {
			expect(validateEmail(123)).toBe(false);
			expect(validateEmail(null)).toBe(false);
			expect(validateEmail(undefined)).toBe(false);
			expect(validateEmail({})).toBe(false);
		});

		it('should reject emails that are too long', () => {
			const longEmail = 'a'.repeat(250) + '@example.com';
			expect(validateEmail(longEmail)).toBe(false);
		});
	});

	describe('validateUsername', () => {
		it('should accept valid usernames', () => {
			const validUsernames = ['john', 'user123', 'admin', 'test_user', 'user-name'];

			validUsernames.forEach((username) => {
				expect(validateUsername(username)).toBe(true);
			});
		});

		it('should reject invalid usernames', () => {
			const invalidUsernames = [
				'ab', // Too short
				'a'.repeat(32), // Too long (max is 31)
				'user name', // Contains space
				'user@name', // Contains special char
				'User123', // Contains uppercase (not allowed)
				'',
				123,
				null,
				undefined
			];

			invalidUsernames.forEach((username) => {
				expect(validateUsername(username)).toBe(false);
			});
		});
	});

	describe('validateFirstOrLastName', () => {
		it('should accept valid names', () => {
			const validNames = ['John', 'Mary', 'A', "O'Brien", 'Jean-Luc', 'a'.repeat(50)];

			validNames.forEach((name) => {
				expect(validateFirstOrLastName(name)).toBe(true);
			});
		});

		it('should reject invalid names', () => {
			const invalidNames = [
				'', // Empty
				'a'.repeat(51), // Too long (max is 50)
				'John123', // Contains numbers
				123,
				null,
				undefined
			];

			invalidNames.forEach((name) => {
				expect(validateFirstOrLastName(name)).toBe(false);
			});
		});
	});

	describe('validatePassword', () => {
		it('should accept valid passwords within length range', () => {
			expect(validatePassword('123456')).toBe(true); // Minimum 6 chars
			expect(validatePassword('a'.repeat(255))).toBe(true);
			expect(validatePassword('Test123!')).toBe(true);
		});

		it('should reject invalid passwords', () => {
			expect(validatePassword('12345')).toBe(false); // Too short (min is 6)
			expect(validatePassword('a'.repeat(256))).toBe(false); // Too long
			expect(validatePassword('')).toBe(false); // Empty
			expect(validatePassword(123)).toBe(false); // Not a string
			expect(validatePassword(null)).toBe(false);
			expect(validatePassword(undefined)).toBe(false);
		});
	});
});
