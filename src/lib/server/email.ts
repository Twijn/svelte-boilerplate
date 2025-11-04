import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';
import { APP_NAME } from '$lib/consts';

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

// Email templates
export function getPasswordResetEmail(resetLink: string, firstName: string): string {
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
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Password Reset Request</h1>
		</div>
		<div class="content">
			<p>Hi ${firstName},</p>
			<p>We received a request to reset your password. Click the button below to create a new password:</p>
			<div style="text-align: center;">
				<a href="${resetLink}" class="button">Reset Password</a>
			</div>
			<p>Or copy and paste this link into your browser:</p>
			<p style="word-break: break-all; color: #2563eb;">${resetLink}</p>
			<div class="warning">
				<strong>Security Notice:</strong>
				<ul style="margin: 8px 0; padding-left: 20px;">
					<li>This link will expire in 1 hour</li>
					<li>If you didn't request this, please ignore this email</li>
				</ul>
			</div>
		</div>
		<div class="footer">
			<p>This is an automated message, please do not reply to this email.</p>
			<p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

export function getWelcomeEmail(firstName: string, username: string): string {
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
			font-size: 28px;
		}
		.content {
			margin: 20px 0;
		}
		.info-box {
			background-color: #eff6ff;
			border-left: 4px solid #2563eb;
			padding: 16px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.footer {
			margin-top: 40px;
			padding-top: 20px;
			border-top: 1px solid #e5e7eb;
			font-size: 14px;
			color: #6b7280;
			text-align: center;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Welcome!</h1>
		</div>
		<div class="content">
			<p>Hi ${firstName},</p>
			<p>Welcome to ${env.APP_NAME || 'our app'}! Your account has been successfully created.</p>
			<div class="info-box">
				<strong>Your Account Details:</strong>
				<ul style="margin: 8px 0; padding-left: 20px;">
					<li><strong>Username:</strong> ${username}</li>
					<li><strong>Name:</strong> ${firstName}</li>
				</ul>
			</div>
			<p>You can now log in and start using all the features available to you.</p>
			<p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
		</div>
		<div class="footer">
			<p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}

export function getPasswordChangedEmail(firstName: string): string {
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
			color: #059669;
			margin: 0;
			font-size: 24px;
		}
		.content {
			margin: 20px 0;
		}
		.success-box {
			background-color: #d1fae5;
			border-left: 4px solid #059669;
			padding: 16px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.warning {
			background-color: #fef3c7;
			border-left: 4px solid #f59e0b;
			padding: 12px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.footer {
			margin-top: 40px;
			padding-top: 20px;
			border-top: 1px solid #e5e7eb;
			font-size: 14px;
			color: #6b7280;
			text-align: center;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Password Changed Successfully</h1>
		</div>
		<div class="content">
			<p>Hi ${firstName},</p>
			<div class="success-box">
				<strong>Your password has been changed successfully.</strong>
				<p style="margin: 8px 0 0 0;">You can now log in with your new password.</p>
			</div>
			<div class="warning">
				<strong>Didn't make this change?</strong>
				<p style="margin: 8px 0 0 0;">If you didn't reset your password, please contact support immediately as your account may be compromised.</p>
			</div>
		</div>
		<div class="footer">
			<p>This is an automated message, please do not reply to this email.</p>
			<p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
	`.trim();
}
