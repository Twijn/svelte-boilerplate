# Activity Logging System

> **A comprehensive, modular logging system for tracking all activities across your SvelteKit application.**

## 📚 Documentation

- **[ACTIVITY_LOGGING.md](./ACTIVITY_LOGGING.md)** - Complete usage guide with examples
- **[MIGRATION_ACTIVITY_LOG.md](./MIGRATION_ACTIVITY_LOG.md)** - Migration guide from rate_limit_attempt
- **[ACTIVITY_LOG_SUMMARY.md](./ACTIVITY_LOG_SUMMARY.md)** - Implementation details and architecture
- **[RATE_LIMITING.md](./RATE_LIMITING.md)** - Rate limiting (now uses activity logs)

## 🚀 Quick Start

### Basic Logging

```typescript
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

// Log an action
await ActivityLogService.log({
	userId: user.id,
	ipAddress: clientIP,
	action: ActivityActions.USER_UPDATE,
	category: ActivityCategory.USER,
	resourceType: 'user',
	resourceId: user.id,
	message: 'User updated their profile'
});
```

### Query Logs

```typescript
// Get user activity
const logs = await ActivityLogService.getUserActivity(userId, 50);

// Get security events
const security = await ActivityLogService.getSecurityEvents(100);

// Get statistics
const stats = await ActivityLogService.getStats(startDate, endDate);
```

## ✨ Features

- **Comprehensive Tracking** - Log any action in your application
- **Rich Context** - Include metadata, user info, IP addresses, user agents
- **Flexible Querying** - Filter by user, action, category, severity, date range
- **Built-in Analytics** - Get statistics and insights from your logs
- **Security Monitoring** - Track failed logins, rate limits, suspicious activity
- **Performance Tracking** - Measure operation duration
- **GDPR Compliance** - Delete user logs on request
- **Audit Trail** - Complete record of who did what and when

## 📊 What It Tracks

### Authentication

- Logins (successful and failed)
- Registrations
- Logouts
- Password resets

### User Management

- User creation, updates, deletion
- Account locking/unlocking
- Profile changes

### Security

- Rate limit checks and violations
- Failed authentication attempts
- Suspicious activity
- Account lockouts

### Roles & Permissions

- Role assignments and revocations
- Permission grants and revokes
- Role creation, updates, deletion

### Custom Actions

- Anything else you want to track!

## 🔧 Integration

Already integrated into:

- ✅ Login endpoint
- ✅ Registration endpoint
- ✅ Rate limiting system

Easy to add to any endpoint:

```typescript
// In your server action
export const actions = {
	update: async ({ locals, request }) => {
		const user = locals.user;
		const formData = await request.formData();

		try {
			// Your update logic
			await updateUser(user.id, formData);

			// Log success
			await ActivityLogService.logSuccess('user.profile.update', ActivityCategory.USER, {
				userId: user.id,
				message: 'Profile updated'
			});

			return { success: true };
		} catch (err) {
			// Log failure
			await ActivityLogService.logFailure(
				'user.profile.update',
				ActivityCategory.USER,
				String(err),
				{ userId: user.id }
			);

			return fail(500, { error: 'Update failed' });
		}
	}
};
```

## 📖 Examples

### Security Event

```typescript
await ActivityLogService.logSecurity(ActivityActions.SUSPICIOUS_ACTIVITY, {
	ipAddress: clientIP,
	severity: LogSeverity.CRITICAL,
	message: 'Multiple failed 2FA attempts',
	metadata: { attempts: 10, timeWindow: '5 minutes' }
});
```

### Performance Tracking

```typescript
const start = Date.now();
await expensiveOperation();
const duration = Date.now() - start;

await ActivityLogService.log({
	action: 'data.export',
	category: ActivityCategory.SYSTEM,
	userId: user.id,
	duration,
	metadata: { recordCount: 10000, format: 'csv' }
});
```

### With Metadata

```typescript
await ActivityLogService.log({
	action: ActivityActions.ROLE_ASSIGN,
	category: ActivityCategory.ROLE,
	userId: adminId,
	resourceType: 'user',
	resourceId: targetUserId,
	metadata: {
		roleId: 'admin',
		roleName: 'Administrator',
		permissions: ['users.manage', 'roles.manage'],
		assignedBy: adminId
	},
	message: `Assigned admin role to user ${targetUserId}`
});
```

## 🎯 Use Cases

### Security Monitoring

- Track all failed login attempts
- Identify suspicious IP addresses
- Monitor rate limit violations
- Detect unusual activity patterns

### Audit Compliance

- Complete audit trail of all actions
- Who did what and when
- Track permission changes
- Export logs for compliance reports

### User Analytics

- Most active users
- Common user flows
- Feature usage statistics
- Error rate analysis

### Performance Monitoring

- Slow operation detection
- Resource usage patterns
- Error frequency tracking
- System health metrics

## 🛠️ Maintenance

### Automatic Cleanup

```typescript
// Clean up logs older than 90 days
await ActivityLogService.cleanup(90);
```

### GDPR Compliance

```typescript
// Delete all logs for a user
await ActivityLogService.deleteUserLogs(userId);
```

## 📈 Statistics

```typescript
const stats = await ActivityLogService.getStats(new Date('2025-01-01'), new Date('2025-12-31'));

console.log(stats);
// {
//   total: 15234,
//   successful: 14890,
//   failed: 344,
//   byCategory: { auth: 5000, user: 3000, security: 500, ... },
//   bySeverity: { info: 14000, warning: 800, error: 434, ... }
// }
```

## 🔍 Advanced Queries

```typescript
// Get all failed actions in the last 24 hours
const failures = await ActivityLogService.query({
	success: false,
	startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
	limit: 100
});

// Get all admin actions
const adminActions = await ActivityLogService.query({
	category: ActivityCategory.ROLE,
	startDate: new Date('2025-01-01')
});

// Get activity for a specific resource
const userChanges = await ActivityLogService.query({
	resourceType: 'user',
	resourceId: userId,
	limit: 50
});
```

## 🎨 Categories & Severity

### Categories

- `AUTH` - Authentication and authorization
- `USER` - User management
- `ROLE` - Role management
- `PERMISSION` - Permission management
- `SECURITY` - Security events
- `SYSTEM` - System events
- `API` - API calls
- `DATABASE` - Database operations

### Severity Levels

- `DEBUG` - Development information
- `INFO` - General events
- `WARNING` - Potential issues
- `ERROR` - Failures
- `CRITICAL` - Immediate action required

## 🚦 Rate Limiting Integration

Rate limiting automatically uses activity logs:

```typescript
// This creates an activity log entry automatically
await RateLimitService.checkRateLimit(clientIP, 'login');

// Logs:
// - action: 'security.rate_limit.check'
// - category: 'security'
// - metadata: { rateLimitAction: 'login' }
```

## 💡 Best Practices

1. **Always log authentication events**
2. **Log permission/role changes**
3. **Include context in metadata**
4. **Use appropriate severity levels**
5. **Log failures with error messages**
6. **Track performance for critical ops**
7. **Clean up regularly**
8. **Don't log sensitive data** (passwords, tokens, etc.)
9. **Use consistent action names**
10. **Document custom actions**

## 📦 What's Included

- `ActivityLogService` - Main service class
- `ActivityActions` - 30+ predefined action constants
- `ActivityCategory` - 8 category enums
- `LogSeverity` - 5 severity levels
- Comprehensive documentation
- Migration guide
- Integration examples

## 🔗 Related

- Rate limiting now uses this system
- Account lockout logging included
- Session management can integrate
- Custom actions easy to add

## 📝 License

Part of the svelte-boilerplate project.
