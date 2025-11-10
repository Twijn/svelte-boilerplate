import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';
import {
	passwordResetTemplate,
	emailVerificationTemplate,
	welcomeTemplate,
	passwordChangedTemplate,
	accountLockedTemplate,
	twoFactorEnabledTemplate,
	twoFactorDisabledTemplate,
	notificationTemplate
} from './email/templates';

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
	if (!transporter) {
		if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
			throw new Error(
'Email configuration is missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD'
);
		}

		transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
user: env.GMAIL_USER,
pass: env.GMAIL_APP_PASSWORD
}
});
	}
	return transporter;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
	try {
		const transport = getTransporter();

		await transport.sendMail({
from: `"${env.APP_NAME || 'App'}" <${env.GMAIL_FROM || env.GMAIL_USER}>`,
to,
subject,
html,
text: text || stripHtml(html)
});

		console.log(`Email sent successfully to ${to}`);
	} catch (error) {
		console.error('Error sending email:', error);
		throw new Error('Failed to send email');
	}
}

// Simple HTML stripper for plain text fallback
function stripHtml(html: string): string {
	return html
		.replace(/<style[^>]*>.*<\/style>/gm, '')
		.replace(/<[^>]+>/gm, '')
		.replace(/\s+/g, ' ')
		.trim();
}

// Legacy wrapper functions for backward compatibility
export function getPasswordResetEmail(resetLink: string, firstName: string): string {
	return passwordResetTemplate({ firstName, resetLink });
}

export function getWelcomeEmail(firstName: string, username: string): string {
	return welcomeTemplate({ firstName, username });
}

export function getPasswordChangedEmail(firstName: string): string {
	return passwordChangedTemplate({ firstName });
}

// Export all template functions for direct use
export {
	passwordResetTemplate,
	emailVerificationTemplate,
	welcomeTemplate,
	passwordChangedTemplate,
	accountLockedTemplate,
	twoFactorEnabledTemplate,
	twoFactorDisabledTemplate,
	notificationTemplate
};
