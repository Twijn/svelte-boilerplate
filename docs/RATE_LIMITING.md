# Rate Limiting & Account Lockout

This boilerplate includes built-in rate limiting and account lockout features to protect against brute force attacks and abuse.

## Features

### Rate Limiting (IP-based)

- **Login**: Max 20 attempts per 15 minutes per IP address
- **Registration**: Max 3 attempts per hour per IP address
- **Password Reset**: Max 3 attempts per hour per IP address
- **General API**: Max 100 requests per minute per IP address

**Note:** IP-based rate limiting protects against automated attacks but will affect all users from the same IP (e.g., users behind the same NAT/proxy). The login limit is intentionally high to let account-specific lockout handle security.

### Account Lockout (User-based)

- Automatically locks accounts after **5 failed login attempts**
- Default lockout duration: **5 minutes**
- Failed attempt counter resets after **10 minutes** of no attempts
- Supports both temporary and permanent lockouts
- Admin interface to unlock accounts

**Note:** Account lockout is per-user and provides the primary security against credential guessing attacks.

## Database Schema

The following fields have been added to the `user` table:

- `isLocked` (boolean): Whether the account is locked
- `lockedAt` (timestamp): When the account was locked
- `lockedUntil` (timestamp): When the account will auto-unlock (null = permanent)
- `failedLoginAttempts` (integer): Count of failed login attempts
- `lastFailedLogin` (timestamp): Timestamp of last failed login

Rate limiting uses the comprehensive `activity_log` table which tracks all system activities including rate limit checks. See [ACTIVITY_LOGGING.md](./ACTIVITY_LOGGING.md) for full details.

**Note:** Rate limiting now uses the modular activity logging system, which provides additional benefits like security event tracking, audit trails, and comprehensive analytics.

## Setup

1. **Push database changes:**

   ```bash
   pnpm db:push
   ```

2. **Configure rate limits** (optional):
   Edit `/src/lib/server/rate-limit.ts` to adjust the rate limit configurations:

   ```typescript
   export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
   	login: {
   		maxAttempts: 5,
   		windowMs: 15 * 60 * 1000,
   		blockDurationMs: 15 * 60 * 1000
   	}
   	// ... other configs
   };
   ```

3. **Configure lockout settings** (optional):
   Edit the constants in `/src/lib/server/rate-limit.ts`:
   ```typescript
   export const ACCOUNT_LOCKOUT_CONFIG = {
   	maxFailedAttempts: 5,
   	lockoutDurationMs: 30 * 60 * 1000,
   	resetAttemptsAfterMs: 15 * 60 * 1000
   };
   ```

## Admin Interface

Navigate to **Admin Dashboard → Locked Accounts** to:

- View all locked accounts
- See lockout reasons and remaining time
- Unlock accounts manually
- View failed login attempt counts

## API Usage

### Check Rate Limit

```typescript
import { RateLimitService } from '$lib/server/rate-limit';

const result = await RateLimitService.checkRateLimit(clientIP, 'login');
if (!result.allowed) {
	// Rate limit exceeded
	console.log(`Retry after ${result.retryAfter} seconds`);
}
```

### Record Attempt

```typescript
await RateLimitService.recordAttempt(clientIP, 'login');
```

### Check Account Lockout

```typescript
import { AccountLockoutService } from '$lib/server/rate-limit';

const lockStatus = await AccountLockoutService.isAccountLocked(userId);
if (lockStatus.locked) {
	// Account is locked
	console.log(lockStatus.reason);
}
```

### Record Failed Login

```typescript
const result = await AccountLockoutService.recordFailedLogin(userId);
if (result.locked) {
	// Account just got locked
	console.log(`Locked until: ${result.lockedUntil}`);
} else {
	console.log(`${result.attemptsRemaining} attempts remaining`);
}
```

### Unlock Account

```typescript
await AccountLockoutService.unlockAccount(userId);
```

### Lock Account (Admin)

```typescript
// Temporary lock (30 minutes)
await AccountLockoutService.lockAccount(userId, false);

// Permanent lock
await AccountLockoutService.lockAccount(userId, true);
```

## Maintenance

### Cleanup Old Rate Limit Data

Run periodically (e.g., daily cron job):

```typescript
import { RateLimitService } from '$lib/server/rate-limit';

// Removes attempts older than the longest configured window
await RateLimitService.cleanupOldAttempts();
```

## Security Notes

1. **IP Address Detection**: The system uses `X-Forwarded-For` header when available. Ensure your reverse proxy (nginx, Cloudflare, etc.) is configured correctly.

2. **Distributed Systems**: The current implementation uses a database for rate limiting, which works across multiple server instances. For very high traffic, consider Redis.

3. **Email Enumeration**: The password reset endpoint always returns success to prevent attackers from discovering valid email addresses.

4. **Login Error Messages**: Failed login messages now include remaining attempts to help legitimate users while deterring attackers.

## Customization

To add rate limiting to a new endpoint:

1. Import the service:

   ```typescript
   import { RateLimitService } from '$lib/server/rate-limit';
   ```

2. Add configuration to `RATE_LIMIT_CONFIGS` in `rate-limit.ts`

3. Check and record in your action:

   ```typescript
   const clientIP =
   	request.headers.get('x-forwarded-for')?.split(',')[0].trim() || getClientAddress();

   const check = await RateLimitService.checkRateLimit(clientIP, 'your-action');
   if (!check.allowed) {
   	return fail(429, { error: 'Too many requests' });
   }

   await RateLimitService.recordAttempt(clientIP, 'your-action');
   ```

## Testing & Troubleshooting

### Understanding the Two-Layer System

The system has TWO separate security mechanisms:

1. **IP Rate Limiting**: Blocks an IP address after too many attempts from that IP
   - Affects ALL users from that IP (e.g., localhost during testing)
   - Used to prevent automated bot attacks
   - Error: "Too many login attempts from this IP address"

2. **Account Lockout**: Locks a specific user account after too many failed passwords
   - Only affects the specific user account
   - Used to prevent credential guessing
   - Error: "Account temporarily locked due to too many failed login attempts"

### Testing Locally

When testing locally, you'll likely hit the IP rate limit before individual account lockouts since all test attempts come from `127.0.0.1`. This is **expected behavior**.

### Clearing Rate Limits During Development

If you hit rate limits during testing, you can clear them via the database:

```bash
# Clear all rate limit activity logs
docker exec -it svelte-boilerplate-db-1 psql -U admin -d mydb -c "DELETE FROM activity_log WHERE action = 'security.rate_limit.check';"

# Or via Drizzle Studio
pnpm db:studio
# Then delete records from the activity_log table with action='security.rate_limit.check'
```

You can also add this to your code temporarily:

```typescript
import { RateLimitService } from '$lib/server/rate-limit';

// Clear all rate limits (use only in development!)
await RateLimitService.clearAllAttempts();

// Clear specific IP
await RateLimitService.clearAttempts('127.0.0.1');
```

### Adjusting Limits

For development, you may want to increase limits in `/src/lib/server/rate-limit.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
	login: {
		maxAttempts: 100, // Very high for testing
		windowMs: 15 * 60 * 1000
	}
};
```
