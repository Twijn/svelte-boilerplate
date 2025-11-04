# Migration: rate_limit_attempt → activity_log

## Overview

The `rate_limit_attempt` table has been replaced with a comprehensive `activity_log` table that can track all system activities, not just rate limiting.

## What Changed

### Database Schema

**Removed:**

- `rate_limit_attempt` table

**Added:**

- `activity_log` table with fields:
  - `id`, `user_id`, `ip_address`, `user_agent`
  - `action`, `category`, `severity`
  - `resource_type`, `resource_id`
  - `metadata`, `message`
  - `success`, `error_message`
  - `created_at`, `duration`

### Code Changes

**New Files:**

- `/src/lib/server/activity-log.ts` - Main activity logging service
- `/docs/ACTIVITY_LOGGING.md` - Comprehensive documentation

**Updated Files:**

- `/src/lib/server/db/schema.ts` - Replaced rateLimitAttempt with activityLog
- `/src/lib/server/rate-limit.ts` - Now uses ActivityLogService instead of direct DB access
- `/src/routes/login/+page.server.ts` - Added activity logging for login attempts
- `/docs/RATE_LIMITING.md` - Updated to reference new system

## Migration Steps

### 1. Apply Database Changes

The migration has already been applied if you see this file. If not:

```bash
# Manual SQL migration
docker exec -it svelte-boilerplate-db-1 psql -U root -d local -c "
CREATE TABLE IF NOT EXISTS activity_log (
  id text PRIMARY KEY NOT NULL,
  user_id text,
  ip_address text,
  user_agent text,
  action text NOT NULL,
  category text NOT NULL,
  severity text DEFAULT 'info' NOT NULL,
  resource_type text,
  resource_id text,
  metadata json,
  message text,
  success boolean DEFAULT true NOT NULL,
  error_message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  duration text,
  CONSTRAINT activity_log_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES \"user\"(id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS rate_limit_attempt CASCADE;
"
```

### 2. Update Imports (If You Have Custom Code)

If you have custom code that imports from the rate limit service, no changes needed! The API remains the same:

```typescript
// This still works exactly as before
import { RateLimitService } from '$lib/server/rate-limit';

await RateLimitService.checkRateLimit(clientIP, 'login');
await RateLimitService.recordAttempt(clientIP, 'login');
```

### 3. Optional: Add Activity Logging to Your Routes

Take advantage of the new system by adding activity logging:

```typescript
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

// Log important events
await ActivityLogService.log({
	userId: user.id,
	ipAddress: clientIP,
	action: ActivityActions.USER_UPDATE,
	category: ActivityCategory.USER,
	resourceType: 'user',
	resourceId: user.id,
	message: 'User updated profile'
});
```

## Benefits

### Before (rate_limit_attempt)

- ✅ Tracked rate limit attempts only
- ❌ No context about what happened
- ❌ No failure tracking
- ❌ Limited to IP-based tracking
- ❌ No categorization or severity levels

### After (activity_log)

- ✅ Tracks ALL system activities
- ✅ Rich context with metadata
- ✅ Success/failure tracking
- ✅ User and IP tracking
- ✅ Categories and severity levels
- ✅ Performance tracking (duration)
- ✅ Comprehensive querying
- ✅ Built-in analytics
- ✅ GDPR compliance helpers
- ✅ Audit trail for compliance

## Data Loss

⚠️ **The old `rate_limit_attempt` table is deleted during migration.**

If you need to preserve this data:

1. Export before migration:

```bash
docker exec -it svelte-boilerplate-db-1 pg_dump -U root -d local -t rate_limit_attempt > backup.sql
```

2. (Optional) Convert old data to new format:

```sql
INSERT INTO activity_log (id, ip_address, action, category, severity, metadata, created_at)
SELECT
  gen_random_uuid()::text,
  identifier,
  'security.rate_limit.check',
  'security',
  'debug',
  json_build_object('rateLimitAction', action),
  attempted_at
FROM rate_limit_attempt_backup;
```

## Backward Compatibility

All existing rate limiting functionality continues to work:

- ✅ `RateLimitService.checkRateLimit()` - Works identically
- ✅ `RateLimitService.recordAttempt()` - Works identically
- ✅ `RateLimitService.cleanupOldAttempts()` - Now cleans all logs
- ✅ `RateLimitService.clearAttempts()` - Still works
- ✅ `RateLimitService.clearAllAttempts()` - Still works

Rate limit configurations are unchanged:

- ✅ `RATE_LIMIT_CONFIGS` - Same structure
- ✅ Login, register, password-reset limits - All preserved

## Testing

After migration, verify everything works:

1. **Test rate limiting:**

```bash
# Try logging in multiple times with wrong password
# Should still hit rate limit after configured attempts
```

2. **Check activity logs:**

```bash
docker exec -it svelte-boilerplate-db-1 psql -U root -d local -c "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10;"
```

3. **Verify no errors:**

```bash
pnpm run check
```

## Rollback

To rollback (not recommended, you'll lose the new features):

1. Recreate old table:

```sql
CREATE TABLE rate_limit_attempt (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  action text NOT NULL,
  attempted_at timestamp with time zone DEFAULT now() NOT NULL
);
```

2. Revert code changes to use old table directly

## Questions?

See the full documentation:

- [ACTIVITY_LOGGING.md](./ACTIVITY_LOGGING.md) - Complete guide to the new system
- [RATE_LIMITING.md](./RATE_LIMITING.md) - Updated rate limiting docs

## Next Steps

Consider adding activity logging to:

- User registration
- Password resets
- Role/permission changes
- Profile updates
- Critical API endpoints
- Admin actions
- Data exports
- Payment processing

The sky's the limit! The modular design makes it easy to log anything.
