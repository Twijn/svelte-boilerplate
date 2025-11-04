# Password Reset & Email System Setup

This document explains how to set up the password reset functionality with Gmail SMTP.

## Features Implemented

✅ **Password Reset Flow**

- Forgot password page (`/forgot-password`)
- Reset password page with token validation (`/reset-password`)
- Secure token-based system with 1-hour expiration
- Email notifications for password changes

✅ **Email System**

- Gmail SMTP integration
- Beautiful HTML email templates
- Password reset emails
- Password changed confirmation emails
- Welcome emails (ready to use)

✅ **Security Features**

- Password reset tokens hashed in database
- Tokens expire after 1 hour
- Old tokens deleted when new ones are created
- All user sessions invalidated after password reset
- Email enumeration protection (always shows success)

## Gmail Setup Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google," click **2-Step Verification**
4. Follow the prompts to enable 2FA (required for app passwords)

### Step 2: Generate an App Password

1. Go to https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. In the "Select app" dropdown, choose **Mail**
4. In the "Select device" dropdown, choose **Other (Custom name)**
5. Enter a name like "SvelteKit App" or "Password Reset System"
6. Click **Generate**
7. Google will display a 16-character app password
8. **Copy this password immediately** - you won't be able to see it again!

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Gmail credentials:

   ```env
   # Email Configuration (Gmail)
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password

   # Application
   APP_NAME="Your App Name"
   PUBLIC_BASE_URL=http://localhost:5173
   ```

   Replace:
   - `your-email@gmail.com` with your Gmail address
   - `your-16-char-app-password` with the app password from Step 2
   - `Your App Name` with your application name
   - `http://localhost:5173` with your production URL when deploying

### Step 4: Run Database Migration

Apply the new database schema that includes email and password reset tokens:

```bash
pnpm db:push
# or
pnpm db:migrate
```

## Usage

### For Users

1. **Forgot Password**
   - Click "Forgot password?" on the login page
   - Enter your email address
   - Check your email for the reset link
   - Click the link (valid for 1 hour)
   - Enter your new password
   - Log in with the new password

2. **Registration**
   - Email is now required during registration
   - Used for password reset and notifications

### For Developers

#### Sending Password Reset Email

```typescript
import { sendPasswordResetEmail } from '$lib/server/password-reset';

await sendPasswordResetEmail('user@example.com');
```

#### Sending Custom Emails

```typescript
import { sendEmail } from '$lib/server/email';

await sendEmail({
	to: 'user@example.com',
	subject: 'Welcome!',
	html: '<h1>Hello!</h1><p>Welcome to our app</p>'
});
```

#### Available Email Templates

```typescript
import { getPasswordResetEmail, getWelcomeEmail, getPasswordChangedEmail } from '$lib/server/email';

// Password reset
const resetHtml = getPasswordResetEmail('https://example.com/reset?token=...', 'John');

// Welcome email
const welcomeHtml = getWelcomeEmail('John', 'john_doe');

// Password changed confirmation
const changedHtml = getPasswordChangedEmail('John');
```

## Testing

### Test the Email System

1. Start your development server:

   ```bash
   pnpm dev
   ```

2. Go to http://localhost:5174/register
3. Create a new account with a real email address
4. Go to http://localhost:5174/forgot-password
5. Enter the email you just registered
6. Check your inbox for the password reset email
7. Click the link and reset your password
8. You should receive a confirmation email

### Troubleshooting

**"Email configuration is missing" Error**

- Make sure `.env` file exists in the project root
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly
- Restart your dev server after changing `.env`

**"Failed to send email" Error**

- Verify your Gmail app password is correct (16 characters, no spaces)
- Make sure 2FA is enabled on your Google account
- Check if your Google account has "Less secure app access" disabled (it should be)
- Try generating a new app password

**Emails Not Arriving**

- Check your spam/junk folder
- Verify the `GMAIL_USER` email is correct
- Make sure the recipient email is valid
- Check server logs for error messages

**"Invalid reset token" Error**

- Token may have expired (1 hour validity)
- User may have requested multiple resets (old tokens are invalidated)
- Token may have been already used

## Production Deployment

### Environment Variables

Make sure to set these in your production environment:

```env
GMAIL_USER=your-production-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
APP_NAME="Your Production App Name"
PUBLIC_BASE_URL=https://yourdomain.com
```

### Security Considerations

1. **Use a dedicated email account** for sending automated emails
2. **Keep your app password secret** - never commit it to version control
3. **Monitor email sending** to detect abuse
4. **Consider rate limiting** password reset requests (recommended: 3 per hour per IP)
5. **Use HTTPS** in production for secure token transmission

### Alternative Email Providers

While this implementation uses Gmail, you can easily switch to other providers:

- **SendGrid**: Professional email service with better deliverability
- **AWS SES**: Cost-effective for high volume
- **Postmark**: Great for transactional emails
- **Resend**: Modern email API

To switch, update `src/lib/server/email.ts` transporter configuration.

## File Structure

```
src/
├── lib/
│   └── server/
│       ├── email.ts              # Email service & templates
│       ├── password-reset.ts     # Password reset logic
│       └── db/
│           └── schema.ts         # Database schema (updated)
├── routes/
│   ├── forgot-password/
│   │   ├── +page.svelte         # Forgot password UI
│   │   └── +page.server.ts      # Forgot password logic
│   ├── reset-password/
│   │   ├── +page.svelte         # Reset password UI
│   │   └── +page.server.ts      # Reset password logic
│   ├── register/
│   │   ├── +page.svelte         # Updated with email field
│   │   └── +page.server.ts      # Updated to handle email
│   └── login/
│       └── +page.svelte          # Added "Forgot password?" link
```

## Database Schema

New tables and columns:

### `user` table

- Added `email` column (unique, required)

### `password_reset_token` table

- `id` - Token ID
- `user_id` - Reference to user
- `token_hash` - Hashed token (SHA-256)
- `expires_at` - Expiration timestamp
- `created_at` - Creation timestamp

## API Reference

### Password Reset Service

```typescript
// Generate and save a password reset token
const token = await createPasswordResetToken(userId: string): Promise<string>

// Validate a reset token and return user ID
const userId = await validatePasswordResetToken(token: string): Promise<string | null>

// Delete a used token
await deletePasswordResetToken(token: string): Promise<void>

// Send password reset email
await sendPasswordResetEmail(email: string): Promise<boolean>

// Send password changed notification
await sendPasswordChangedNotification(userId: string): Promise<void>
```

### Email Service

```typescript
// Send any email
await sendEmail({
  to: string,
  subject: string,
  html: string,
  text?: string  // Optional plain text version
}): Promise<void>
```

## Next Steps

Consider adding:

1. **Rate Limiting** - Limit password reset requests per IP/user
2. **Email Verification** - Verify email addresses during registration
3. **Email Change Flow** - Allow users to change their email with verification
4. **Password Strength Indicator** - UI feedback for password strength
5. **Security Questions** - Additional verification for sensitive actions
6. **Two-Factor Authentication** - Add TOTP-based 2FA
7. **Login History** - Track and notify users of new logins

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Verify your Gmail app password and 2FA settings
4. Test with a simple script to isolate email sending issues
