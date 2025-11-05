# Email Verification

This boilerplate includes a complete email verification system to ensure users have access to the email address they register with.

## Features

- **Automatic Email on Registration**: When a user registers, they receive a verification email with a unique link
- **Secure Token System**: Uses 20-byte random tokens with argon2 hashing for storage
- **24-Hour Expiry**: Verification tokens expire after 24 hours for security
- **Resend Capability**: Users can request a new verification email if needed
- **Visual Banner**: Unverified users see a prominent banner in the panel with a resend button
- **Activity Logging**: All verification actions are logged for audit purposes

## Database Schema

### User Table

- `email_verified`: Boolean flag indicating if email is verified (default: false)
- `email_verified_at`: Timestamp of when email was verified

### Email Verification Token Table

- `id`: Unique token identifier
- `user_id`: Foreign key to user (cascade delete)
- `token_hash`: Argon2 hash of the verification token
- `expires_at`: Token expiration timestamp (24 hours from creation)
- `created_at`: Token creation timestamp

## User Flow

1. **Registration**:
   - User submits registration form
   - Account is created with `email_verified = false`
   - Verification email is sent (registration continues even if email fails)
   - User is logged in and redirected to panel

2. **Panel Access**:
   - Unverified users see a purple banner at the top of all panel pages
   - Banner includes a "Resend Email" button
   - Users can still access all features (verification not enforced by default)

3. **Verification**:
   - User clicks link in email (format: `/verify-email?token=...`)
   - Token is validated and user is marked as verified
   - Activity is logged
   - User is redirected to panel with success message

4. **Resend**:
   - User clicks "Resend Email" button in banner
   - New token is generated (old one is deleted)
   - New email is sent
   - Success notification is shown

## API Endpoints

### `/verify-email` (GET)

- Query param: `token` (verification token from email)
- Validates token and marks user as verified
- Shows success/error page with appropriate messaging

### `/resend-verification` (POST)

- Requires authenticated user
- Checks if user is already verified
- Creates new token and sends email
- Returns JSON success/error response

## Service Functions

Located in `src/lib/server/email-verification.ts`:

### `generateToken()`

Generates a random 20-byte token encoded in base32 lowercase (no padding).

### `hashToken(token: string)`

Hashes a token using argon2 for secure storage.

### `createEmailVerificationToken(userId: string)`

Creates a verification token for a user:

- Deletes any existing tokens for the user
- Generates new token with 24-hour expiry
- Stores hashed version in database
- Returns plain token for email link

### `sendVerificationEmail(email: string, token: string, origin: string)`

Sends HTML verification email:

- Professional styling with brand colors
- Clear call-to-action button
- Includes expiry information
- Contains verification link

### `verifyEmailToken(token: string)`

Validates and processes verification:

- Finds token in database
- Checks expiration
- Verifies hash matches
- Marks user as verified
- Deletes token
- Returns user info or error

### `resendVerificationEmail(userId: string, email: string, origin: string)`

Resends verification email:

- Checks if user is already verified
- Creates new token (replaces old one)
- Sends email
- Returns success or error message

## Components

### `VerificationBanner.svelte`

- Location: `src/lib/components/ui/VerificationBanner.svelte`
- Displays at top of panel for unverified users
- Purple gradient background for visibility
- Includes resend button with loading state
- Shows success/error notifications
- Responsive design (stacks on mobile)

## Configuration

### Email Template

The verification email uses the following styling:

- Brand colors: Purple gradient (#667eea to #764ba2)
- Professional layout with centered content
- Large call-to-action button
- Clear expiry information (24 hours)
- Fallback text link if button doesn't work

### Seeded Users

The admin user created by the seed script is automatically marked as verified:

- `email_verified = true`
- `email_verified_at = now()`

This prevents test accounts from needing verification.

## Security Considerations

1. **Token Storage**: Only hashed tokens are stored in the database
2. **Time-Limited**: Tokens expire after 24 hours
3. **Single-Use**: Tokens are deleted after successful verification
4. **Rate Limiting**: Registration is rate-limited to prevent abuse
5. **Activity Logging**: All verification actions are logged
6. **No Forced Verification**: Users can access the app while unverified (can be changed)

## Optional: Enforce Email Verification

To require email verification for access, you can add middleware to check `locals.user?.emailVerified`:

```typescript
// In hooks.server.ts or a middleware file
if (locals.user && !locals.user.emailVerified) {
	// Allow access to verification-related routes
	const allowedRoutes = ['/verify-email', '/resend-verification', '/logout'];
	if (!allowedRoutes.some((route) => event.url.pathname.startsWith(route))) {
		return redirect(302, '/verify-email-required');
	}
}
```

This is not implemented by default to allow maximum flexibility.

## Testing

To test the email verification system:

1. Register a new account
2. Check your email inbox for the verification email
3. Click the verification link
4. Confirm the banner disappears after verification
5. Try resending verification email before verifying
6. Check activity logs to confirm all actions are logged

## Troubleshooting

### Email Not Received

- Check spam folder
- Verify SMTP configuration in `.env`
- Check server logs for email sending errors
- Use resend button in panel banner

### Token Expired

- Tokens expire after 24 hours
- Use resend button to generate a new token
- Old tokens are automatically deleted

### Already Verified

- Once verified, attempting to verify again shows success message
- Resend endpoint prevents sending to verified users
- Banner only shows for unverified users
