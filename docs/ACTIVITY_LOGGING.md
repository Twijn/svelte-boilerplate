# Activity Logging System

A comprehensive, modular activity logging system that tracks all actions and changes across your application.

## Overview

The activity logging system replaces the simple `rate_limit_attempt` table with a flexible `activity_log` table that can track:

- Authentication events (logins, logouts, registrations)
- User management actions (create, update, delete, lock/unlock)
- Role and permission changes
- Security events (rate limits, suspicious activity)
- System events (errors, migrations)
- Custom application events

## Database Schema

### `activity_log` Table

```typescript
{
	id: string; // Primary key
	userId: string | null; // Who performed the action (null for anonymous/system)
	ipAddress: string | null; // IP address of the actor
	userAgent: string | null; // Browser/client information

	action: string; // e.g., 'user.login', 'role.update'
	category: string; // e.g., 'auth', 'security', 'user'
	severity: string; // 'debug', 'info', 'warning', 'error', 'critical'

	resourceType: string | null; // What was affected: 'user', 'role', 'session'
	resourceId: string | null; // ID of the affected resource

	metadata: object | null; // Flexible JSON for additional context
	message: string | null; // Human-readable description

	success: boolean; // Whether the action succeeded
	errorMessage: string | null; // Error details if success=false

	createdAt: Date; // When the action occurred
	duration: string | null; // How long the action took (in ms)
}
```

## Usage

### Basic Logging

```typescript
import { ActivityLogService, ActivityCategory, LogSeverity } from '$lib/server/activity-log';

// Log a simple action
await ActivityLogService.log({
	userId: user.id,
	ipAddress: clientIP,
	action: 'user.profile.update',
	category: ActivityCategory.USER,
	resourceType: 'user',
	resourceId: user.id,
	message: 'User updated their profile'
});
```

### Using Predefined Actions

```typescript
import { ActivityActions } from '$lib/server/activity-log';

// Log a successful login
await ActivityLogService.log({
	userId: user.id,
	ipAddress: clientIP,
	userAgent: request.headers.get('user-agent'),
	action: ActivityActions.LOGIN,
	category: ActivityCategory.AUTH,
	resourceType: 'user',
	resourceId: user.id,
	success: true,
	message: `Successful login for user: ${username}`
});

// Log a failed login
await ActivityLogService.log({
	userId: user.id,
	ipAddress: clientIP,
	action: ActivityActions.LOGIN_FAILED,
	category: ActivityCategory.AUTH,
	resourceType: 'user',
	resourceId: user.id,
	success: false,
	message: `Failed login attempt for user: ${username}`
});
```

### Convenience Methods

```typescript
// Log a success
await ActivityLogService.logSuccess('user.email.verify', ActivityCategory.USER, {
	userId: user.id,
	message: 'Email verified'
});

// Log a failure
await ActivityLogService.logFailure(
	'payment.process',
	ActivityCategory.SYSTEM,
	'Payment gateway timeout',
	{ userId: user.id, metadata: { amount: 99.99, currency: 'USD' } }
);

// Log a security event
await ActivityLogService.logSecurity(ActivityActions.SUSPICIOUS_ACTIVITY, {
	ipAddress: clientIP,
	severity: LogSeverity.CRITICAL,
	message: 'Multiple failed 2FA attempts',
	metadata: { attempts: 10, timeWindow: '5 minutes' }
});
```

### Including Metadata

Use the `metadata` field for structured, queryable data:

```typescript
await ActivityLogService.log({
	action: 'role.assign',
	category: ActivityCategory.ROLE,
	userId: adminId,
	resourceType: 'user',
	resourceId: targetUserId,
	metadata: {
		roleId: 'admin',
		roleName: 'Administrator',
		permissions: ['users.manage', 'roles.manage'],
		assignedBy: adminId,
		reason: 'Promotion to admin'
	},
	message: `Assigned admin role to user ${targetUserId}`
});
```

### Performance Tracking

Track how long operations take:

```typescript
const startTime = Date.now();

// Perform some operation
await someExpensiveOperation();

const duration = Date.now() - startTime;

await ActivityLogService.log({
	action: 'data.export',
	category: ActivityCategory.SYSTEM,
	userId: user.id,
	duration,
	metadata: { recordCount: 10000, format: 'csv' },
	message: 'Exported user data'
});
```

## Querying Logs

### Basic Queries

```typescript
// Get all activities for a user
const userActivities = await ActivityLogService.getUserActivity(userId, 100);

// Get security events
const securityEvents = await ActivityLogService.getSecurityEvents(50);

// Get failed logins
const failedLogins = await ActivityLogService.getFailedLogins(
	new Date('2025-01-01'),
	new Date('2025-12-31')
);

// Get rate limit violations
const rateLimitViolations = await ActivityLogService.getRateLimitViolations(
	clientIP,
	new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
);
```

### Advanced Queries

```typescript
// Query with multiple filters
const logs = await ActivityLogService.query({
	category: ActivityCategory.AUTH,
	severity: LogSeverity.ERROR,
	success: false,
	startDate: new Date('2025-11-01'),
	endDate: new Date('2025-11-04'),
	limit: 100,
	offset: 0
});

// Query by resource
const userChanges = await ActivityLogService.query({
	resourceType: 'user',
	resourceId: userId,
	limit: 50
});

// Query by IP address
const ipActivity = await ActivityLogService.query({
	ipAddress: '192.168.1.100',
	startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
	limit: 200
});
```

### Statistics

```typescript
// Get overall statistics
const stats = await ActivityLogService.getStats(new Date('2025-11-01'), new Date('2025-11-30'));

console.log(stats);
// {
//   total: 15234,
//   successful: 14890,
//   failed: 344,
//   byCategory: {
//     auth: 5000,
//     user: 3000,
//     security: 500,
//     ...
//   },
//   bySeverity: {
//     info: 14000,
//     warning: 800,
//     error: 434,
//     ...
//   }
// }

// Count specific activities
const failedLoginCount = await ActivityLogService.count({
	action: ActivityActions.LOGIN_FAILED,
	startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
});
```

## Predefined Actions

The system includes predefined action constants for consistency:

### Authentication

- `ActivityActions.LOGIN` - Successful login
- `ActivityActions.LOGIN_FAILED` - Failed login attempt
- `ActivityActions.LOGOUT` - User logout
- `ActivityActions.REGISTER` - New user registration
- `ActivityActions.PASSWORD_RESET_REQUEST` - Password reset requested
- `ActivityActions.PASSWORD_RESET_COMPLETE` - Password reset completed

### User Management

- `ActivityActions.USER_CREATE` - User account created
- `ActivityActions.USER_UPDATE` - User account updated
- `ActivityActions.USER_DELETE` - User account deleted
- `ActivityActions.USER_LOCK` - User account locked
- `ActivityActions.USER_UNLOCK` - User account unlocked

### Role Management

- `ActivityActions.ROLE_CREATE` - Role created
- `ActivityActions.ROLE_UPDATE` - Role updated
- `ActivityActions.ROLE_DELETE` - Role deleted
- `ActivityActions.ROLE_ASSIGN` - Role assigned to user
- `ActivityActions.ROLE_REVOKE` - Role revoked from user

### Permission Management

- `ActivityActions.PERMISSION_GRANT` - Permission granted
- `ActivityActions.PERMISSION_REVOKE` - Permission revoked

### Security

- `ActivityActions.RATE_LIMIT_CHECK` - Rate limit check performed
- `ActivityActions.RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `ActivityActions.ACCOUNT_LOCKED` - Account locked due to security
- `ActivityActions.SUSPICIOUS_ACTIVITY` - Suspicious activity detected

### System

- `ActivityActions.SYSTEM_START` - System/service started
- `ActivityActions.SYSTEM_ERROR` - System error occurred
- `ActivityActions.DATABASE_MIGRATION` - Database migration performed

## Categories

Group related actions with categories:

- `ActivityCategory.AUTH` - Authentication and authorization
- `ActivityCategory.USER` - User management
- `ActivityCategory.ROLE` - Role management
- `ActivityCategory.PERMISSION` - Permission management
- `ActivityCategory.SECURITY` - Security events
- `ActivityCategory.SYSTEM` - System events
- `ActivityCategory.API` - API calls
- `ActivityCategory.DATABASE` - Database operations

## Severity Levels

Classify events by importance:

- `LogSeverity.DEBUG` - Development/debugging information
- `LogSeverity.INFO` - General informational events
- `LogSeverity.WARNING` - Warning conditions (potential issues)
- `LogSeverity.ERROR` - Error conditions (failures)
- `LogSeverity.CRITICAL` - Critical conditions (immediate action required)

## Maintenance

### Cleanup Old Logs

```typescript
// Delete logs older than 90 days (default)
await ActivityLogService.cleanup();

// Custom retention period
await ActivityLogService.cleanup(30); // Keep only last 30 days
```

Set up a cron job for automatic cleanup:

```typescript
// Run daily at 2 AM
import { ActivityLogService } from '$lib/server/activity-log';

async function dailyLogCleanup() {
	await ActivityLogService.cleanup(90);
	console.log('Activity logs cleaned up');
}
```

### GDPR Compliance

Delete all logs for a user when they request data deletion:

```typescript
await ActivityLogService.deleteUserLogs(userId);
```

## Integration with Rate Limiting

The rate limiting system now uses activity logs instead of a separate table:

```typescript
// Rate limit checks are automatically logged
await RateLimitService.checkRateLimit(clientIP, 'login');
// This logs: action='security.rate_limit.check', metadata={ rateLimitAction: 'login' }

// Rate limit exceeded is logged with warning severity
// This logs: action='security.rate_limit.exceeded', severity='warning'
```

## Creating Custom Actions

Define your own actions following the naming convention:

```typescript
const CustomActions = {
	INVOICE_CREATED: 'invoice.create',
	INVOICE_PAID: 'invoice.paid',
	INVOICE_CANCELLED: 'invoice.cancelled',
	DOCUMENT_UPLOADED: 'document.upload',
	DOCUMENT_DELETED: 'document.delete',
	EXPORT_STARTED: 'export.start',
	EXPORT_COMPLETED: 'export.complete'
} as const;

// Use them
await ActivityLogService.log({
	action: CustomActions.INVOICE_CREATED,
	category: ActivityCategory.SYSTEM, // or create your own category
	userId: user.id,
	resourceType: 'invoice',
	resourceId: invoice.id,
	metadata: {
		amount: invoice.amount,
		currency: invoice.currency,
		dueDate: invoice.dueDate
	}
});
```

## Admin Interface

Build admin dashboards to monitor activity:

```typescript
// Example: Recent activity page
export const load: PageServerLoad = async () => {
	const recentActivity = await ActivityLogService.query({
		limit: 100
	});

	const securityEvents = await ActivityLogService.getSecurityEvents(50);

	const stats = await ActivityLogService.getStats(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
		new Date()
	);

	return {
		recentActivity,
		securityEvents,
		stats
	};
};
```

## Best Practices

1. **Always log authentication events** - Track logins, logouts, failed attempts
2. **Log permission changes** - Track who granted/revoked permissions
3. **Include context in metadata** - Store structured data for later analysis
4. **Use appropriate severity levels** - Critical for security issues, info for routine actions
5. **Log failures with error messages** - Help with debugging and security analysis
6. **Track performance for critical operations** - Use duration field
7. **Clean up regularly** - Don't let logs grow indefinitely
8. **Respect privacy** - Don't log sensitive data (passwords, credit cards, etc.)
9. **Use consistent action names** - Follow the pattern: `resource.action`
10. **Document custom actions** - Keep a reference of your application's action types

## Example: Complete Authentication Flow

```typescript
// In your login handler
export const actions: Actions = {
	default: async (event) => {
		const { username, password } = await getFormData(event);
		const clientIP = getClientIP(event);
		const userAgent = event.request.headers.get('user-agent');

		// Find user
		const user = await findUserByUsername(username);
		if (!user) {
			await ActivityLogService.log({
				ipAddress: clientIP,
				userAgent,
				action: ActivityActions.LOGIN_FAILED,
				category: ActivityCategory.AUTH,
				success: false,
				message: `Failed login - user not found: ${username}`,
				metadata: { username, reason: 'user_not_found' }
			});
			return fail(400, { message: 'Invalid credentials' });
		}

		// Verify password
		const valid = await verifyPassword(password, user.passwordHash);
		if (!valid) {
			await ActivityLogService.log({
				userId: user.id,
				ipAddress: clientIP,
				userAgent,
				action: ActivityActions.LOGIN_FAILED,
				category: ActivityCategory.AUTH,
				resourceType: 'user',
				resourceId: user.id,
				success: false,
				message: `Failed login - invalid password for user: ${username}`,
				metadata: { username, reason: 'invalid_password' }
			});
			return fail(400, { message: 'Invalid credentials' });
		}

		// Success!
		await ActivityLogService.log({
			userId: user.id,
			ipAddress: clientIP,
			userAgent,
			action: ActivityActions.LOGIN,
			category: ActivityCategory.AUTH,
			resourceType: 'user',
			resourceId: user.id,
			success: true,
			message: `Successful login for user: ${username}`
		});

		// Create session and redirect...
	}
};
```

## Migration from rate_limit_attempt

The old `rate_limit_attempt` table has been replaced with `activity_log`. The migration is automatic:

- Rate limit checks now create activity logs with `action='security.rate_limit.check'`
- The `rateLimitAction` (e.g., 'login', 'register') is stored in `metadata`
- All existing rate limit functionality continues to work
- You get comprehensive logging as a bonus!

No code changes required in your application - the `RateLimitService` API remains the same.
