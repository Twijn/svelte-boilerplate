/**
 * Email Template Engine
 *
 * Provides a reusable template system for emails with variable substitution.
 */

import { APP_NAME } from '$lib/consts';

export interface TemplateVariables {
	[key: string]: string | number | boolean | undefined;
}

/**
 * Base HTML wrapper for all email templates
 */
function baseTemplate(content: string, variables: TemplateVariables = {}): string {
	const appName = variables.appName || APP_NAME;
	const year = new Date().getFullYear();

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
			background-color: #f3f4f6;
		}
		.container {
			background: #ffffff;
			border-radius: 8px;
			padding: 40px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}
		.header {
			text-align: center;
			margin-bottom: 30px;
		}
		.header h1 {
			color: #2563eb;
			margin: 0;
			font-size: 24px;
		}
		.content {
			margin: 20px 0;
		}
		.button {
			display: inline-block;
			padding: 12px 32px;
			background-color: #2563eb;
			color: #ffffff !important;
			text-decoration: none;
			border-radius: 6px;
			margin: 20px 0;
			font-weight: 600;
		}
		.button:hover {
			background-color: #1d4ed8;
		}
		.footer {
			margin-top: 40px;
			padding-top: 20px;
			border-top: 1px solid #e5e7eb;
			font-size: 14px;
			color: #6b7280;
			text-align: center;
		}
		.warning {
			background-color: #fef3c7;
			border-left: 4px solid #f59e0b;
			padding: 12px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.info-box {
			background-color: #eff6ff;
			border-left: 4px solid #2563eb;
			padding: 16px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.success-box {
			background-color: #f0fdf4;
			border-left: 4px solid #10b981;
			padding: 16px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.error-box {
			background-color: #fef2f2;
			border-left: 4px solid #ef4444;
			padding: 16px;
			margin: 20px 0;
			border-radius: 4px;
		}
	</style>
</head>
<body>
	<div class="container">
		${content}
		<div class="footer">
			<p>This is an automated message, please do not reply to this email.</p>
			<p>&copy; ${year} ${appName}. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Replace variables in template string
 * Supports {{variableName}} syntax
 */
function replaceVariables(template: string, variables: TemplateVariables): string {
	return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		const value = variables[key];
		return value !== undefined ? String(value) : match;
	});
}

/**
 * Email Templates
 */

export const passwordResetTemplate = (variables: {
	firstName: string;
	resetLink: string;
}): string => {
	const content = `
		<div class="header">
			<h1>Password Reset Request</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<p>We received a request to reset your password. Click the button below to create a new password:</p>
			<div style="text-align: center;">
				<a href="{{resetLink}}" class="button">Reset Password</a>
			</div>
			<p>Or copy and paste this link into your browser:</p>
			<p style="word-break: break-all; color: #2563eb;">{{resetLink}}</p>
			<div class="warning">
				<strong>Security Notice:</strong>
				<ul style="margin: 8px 0; padding-left: 20px;">
					<li>This link will expire in 1 hour</li>
					<li>If you didn't request this, please ignore this email</li>
				</ul>
			</div>
		</div>
	`;
	return baseTemplate(replaceVariables(content, variables), variables);
};

export const emailVerificationTemplate = (variables: {
	firstName: string;
	verificationLink: string;
}): string => {
	const content = `
		<div class="header">
			<h1>Verify Your Email</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<p>Thank you for creating an account! Please verify your email address by clicking the button below:</p>
			<div style="text-align: center;">
				<a href="{{verificationLink}}" class="button">Verify Email</a>
			</div>
			<p>Or copy and paste this link into your browser:</p>
			<p style="word-break: break-all; color: #2563eb;">{{verificationLink}}</p>
			<div class="warning">
				<strong>Note:</strong>
				<ul style="margin: 8px 0; padding-left: 20px;">
					<li>This link will expire in 24 hours</li>
					<li>If you didn't create an account, please ignore this email</li>
				</ul>
			</div>
		</div>
	`;
	return baseTemplate(replaceVariables(content, variables), variables);
};

export const welcomeTemplate = (variables: {
	firstName: string;
	username: string;
	appName?: string;
}): string => {
	const content = `
		<div class="header">
			<h1>Welcome! 🎉</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<p>Welcome to {{appName}}! Your account has been successfully created.</p>
			<div class="info-box">
				<strong>Your Account Details:</strong>
				<ul style="margin: 8px 0; padding-left: 20px;">
					<li><strong>Username:</strong> {{username}}</li>
					<li><strong>Name:</strong> {{firstName}}</li>
				</ul>
			</div>
			<p>You can now log in and start using all the features available to you.</p>
			<p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
		</div>
	`;
	return baseTemplate(
		replaceVariables(content, { ...variables, appName: variables.appName || APP_NAME }),
		variables
	);
};

export const passwordChangedTemplate = (variables: { firstName: string }): string => {
	const content = `
		<div class="header">
			<h1>Password Changed</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<div class="success-box">
				<strong>✓ Your password has been successfully changed.</strong>
			</div>
			<p>This is a confirmation that your password was recently changed.</p>
			<div class="warning">
				<strong>Didn't change your password?</strong>
				<p style="margin: 8px 0;">If you didn't make this change, please contact our support team immediately and reset your password.</p>
			</div>
		</div>
	`;
	return baseTemplate(replaceVariables(content, variables), variables);
};

export const accountLockedTemplate = (variables: {
	firstName: string;
	reason?: string;
}): string => {
	const content = `
		<div class="header">
			<h1>Account Locked</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<div class="error-box">
				<strong>Your account has been locked.</strong>
			</div>
			${variables.reason ? `<p><strong>Reason:</strong> ${variables.reason}</p>` : ''}
			<p>This may be due to:</p>
			<ul>
				<li>Multiple failed login attempts</li>
				<li>Suspicious activity detected</li>
				<li>Administrative action</li>
			</ul>
			<p>Please contact our support team to unlock your account.</p>
		</div>
	`;
	return baseTemplate(replaceVariables(content, variables), variables);
};

export const twoFactorEnabledTemplate = (variables: { firstName: string }): string => {
	const content = `
		<div class="header">
			<h1>Two-Factor Authentication Enabled</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<div class="success-box">
				<strong>✓ Two-factor authentication has been enabled on your account.</strong>
			</div>
			<p>Your account is now more secure! You'll need your authentication app to log in from now on.</p>
			<div class="info-box">
				<strong>Remember to save your backup codes:</strong>
				<p style="margin: 8px 0;">Keep your backup codes in a safe place. You'll need them if you lose access to your authentication app.</p>
			</div>
			<div class="warning">
				<strong>Didn't enable 2FA?</strong>
				<p style="margin: 8px 0;">If you didn't make this change, please contact our support team immediately.</p>
			</div>
		</div>
	`;
	return baseTemplate(replaceVariables(content, variables), variables);
};

export const twoFactorDisabledTemplate = (variables: { firstName: string }): string => {
	const content = `
		<div class="header">
			<h1>Two-Factor Authentication Disabled</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<div class="warning">
				<strong>⚠ Two-factor authentication has been disabled on your account.</strong>
			</div>
			<p>Your account is now less secure. We recommend re-enabling two-factor authentication to protect your account.</p>
			<div class="error-box">
				<strong>Didn't disable 2FA?</strong>
				<p style="margin: 8px 0;">If you didn't make this change, please contact our support team immediately and change your password.</p>
			</div>
		</div>
	`;
	return baseTemplate(replaceVariables(content, variables), variables);
};

/**
 * Generic notification template
 */
export const notificationTemplate = (variables: {
	firstName: string;
	title: string;
	message: string;
	type?: 'info' | 'success' | 'warning' | 'error';
	actionText?: string;
	actionLink?: string;
}): string => {
	const boxClass = variables.type ? `${variables.type}-box` : 'info-box';

	const content = `
		<div class="header">
			<h1>{{title}}</h1>
		</div>
		<div class="content">
			<p>Hi {{firstName}},</p>
			<div class="${boxClass}">
				{{message}}
			</div>
			${
				variables.actionText && variables.actionLink
					? `
				<div style="text-align: center;">
					<a href="${variables.actionLink}" class="button">${variables.actionText}</a>
				</div>
			`
					: ''
			}
		</div>
	`;
	return baseTemplate(replaceVariables(content, variables), variables);
};
