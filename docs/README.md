# SvelteKit Boilerplate Documentation

Welcome to the comprehensive documentation for this SvelteKit authentication and authorization boilerplate. This boilerplate provides a production-ready foundation for building secure web applications with user management, permissions, and activity tracking.

## 📚 Table of Contents

### � Deployment & Setup

- **[Deployment Guide](./DEPLOYMENT.md)** - Step-by-step deployment instructions for Vercel, Netlify, Railway, Fly.io, Docker, and VPS

### �🔐 Authentication & Security

- **[Password Reset Setup](./PASSWORD_RESET_SETUP.md)** - Configure email-based password reset functionality with Gmail SMTP
- **[Email Verification](./EMAIL_VERIFICATION.md)** - Enable email verification for new user registrations
- **[Rate Limiting](./RATE_LIMITING.md)** - IP-based rate limiting and account lockout protection

### 👥 Authorization & Permissions

- **[Permissions Guide](./PERMISSIONS_GUIDE.md)** - How to add and manage custom permissions in your application

### 📊 Activity & Monitoring

- **[Activity Logging](./ACTIVITY_LOGGING.md)** - Comprehensive activity logging system for audit trails and analytics

---

## 🚀 Quick Start

### Core Features

This boilerplate includes:

- ✅ **User Authentication** - Registration, login, logout with session management
- ✅ **Two-Factor Authentication** - TOTP-based 2FA with backup codes
- ✅ **Email System** - Password reset, verification, and notifications
- ✅ **Permission System** - Role-based and granular permission control
- ✅ **Activity Logging** - Complete audit trail of all system actions
- ✅ **Rate Limiting** - Protection against brute force and abuse
- ✅ **Account Management** - Profile editing, avatar upload, account deletion
- ✅ **Admin Dashboard** - User and role management interface

### First Steps

1. **Set up your environment** - Copy `.env.example` to `.env` and configure
2. **Configure email** - Follow [Password Reset Setup](./PASSWORD_RESET_SETUP.md) for Gmail SMTP
3. **Start the database** - Run `docker-compose up -d`
4. **Push the schema** - Run `pnpm db:push`
5. **Seed initial data** - Run `pnpm db:seed`
6. **Start development** - Run `pnpm dev`

---

## 📖 Documentation by Feature

### Authentication Features

#### Password Management

- **Password Reset Flow** - Users can reset forgotten passwords via email
- **Secure Token System** - SHA-256 hashed tokens with 1-hour expiration
- **Email Notifications** - Confirmation emails for password changes
- 📖 [Full Guide →](./PASSWORD_RESET_SETUP.md)

#### Email Verification

- **Registration Verification** - New users receive verification emails
- **24-Hour Tokens** - Secure, time-limited verification links
- **Resend Capability** - Users can request new verification emails
- 📖 [Full Guide →](./EMAIL_VERIFICATION.md)

#### Two-Factor Authentication

- **TOTP Support** - Time-based one-time passwords (Google Authenticator, Authy)
- **Backup Codes** - Recovery codes for account access
- **QR Code Setup** - Easy 2FA enrollment
- 📖 Implementation included in codebase

### Security Features

#### Rate Limiting

- **IP-Based Protection** - Prevent automated attacks from specific IPs
- **Account Lockout** - Lock accounts after failed login attempts
- **Configurable Limits** - Customize thresholds per endpoint
- 📖 [Full Guide →](./RATE_LIMITING.md)

Default limits:

- **Login**: 20 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per IP

#### Activity Logging

- **Comprehensive Tracking** - Log all user actions and system events
- **Flexible Querying** - Filter by user, action, category, severity
- **Built-in Analytics** - Statistics and insights from logs
- **GDPR Compliance** - User data deletion support
- 📖 [Full Guide →](./ACTIVITY_LOGGING.md)

### Authorization Features

#### Permission System

- **Role-Based Access** - Assign users to roles with predefined permissions
- **Granular Permissions** - Control access at a fine-grained level
- **Category Organization** - Permissions grouped by type (admin, content, API, etc.)
- **Easy Extension** - Add new permissions in 3 steps
- 📖 [Full Guide →](./PERMISSIONS_GUIDE.md)

Built-in permissions:

- `admin` - Full administrative access
- `manage_users` - User management
- `manage_roles` - Role management
- `view_logs` - View activity logs

---

## 🛠️ Common Tasks

### Adding a New Permission

```typescript
// 1. Define in src/lib/constants/permissions.ts
export_data: {
  key: 'export_data',
  label: 'Export Data',
  description: 'Export data in various formats',
  category: 'api'
}

// 2. Use in code
import { PERMISSIONS } from '$lib/constants/permissions';
const hasPermission = await PermissionService.hasPermission(userId, PERMISSIONS.EXPORT_DATA);

// 3. Protect routes
export const load = requirePermission(PERMISSIONS.EXPORT_DATA, async ({ locals }) => {
  // Protected code
});
```

📖 [Full Guide →](./PERMISSIONS_GUIDE.md)

### Logging an Activity

```typescript
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

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

📖 [Full Guide →](./ACTIVITY_LOGGING.md)

### Configuring Rate Limits

```typescript
// Edit src/lib/server/rate-limit.ts
export const RATE_LIMIT_CONFIGS = {
	login: {
		maxAttempts: 20,
		windowMs: 15 * 60 * 1000,
		blockDurationMs: 15 * 60 * 1000
	}
};
```

📖 [Full Guide →](./RATE_LIMITING.md)

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── admin/          # Admin-specific components
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── constants/
│   │   └── permissions.ts  # Permission definitions
│   ├── server/
│   │   ├── activity-log.ts # Activity logging service
│   │   ├── auth.ts         # Authentication logic
│   │   ├── email.ts        # Email service
│   │   ├── permissions.ts  # Permission checking
│   │   ├── rate-limit.ts   # Rate limiting
│   │   └── db/
│   │       └── schema.ts   # Database schema
│   └── stores/             # Client-side stores
├── routes/
│   ├── login/              # Login pages
│   ├── register/           # Registration
│   ├── forgot-password/    # Password reset request
│   ├── reset-password/     # Password reset confirmation
│   ├── verify-email/       # Email verification
│   └── panel/              # Protected user area
│       ├── profile/        # User profile management
│       └── admin/          # Admin dashboard
└── docs/                   # Documentation (you are here!)
```

---

## 🔧 Configuration

### Environment Variables

Required variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Application
APP_NAME="Your App Name"
PUBLIC_BASE_URL=http://localhost:5173
```

📖 [Email Setup Guide →](./PASSWORD_RESET_SETUP.md)

### Database Management

```bash
# Push schema changes
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Seed initial data (creates admin user and roles)
pnpm db:seed
```

---

## 🎯 Best Practices

### Security

1. **Use environment variables** - Never commit secrets to version control
2. **Enable rate limiting** - Protect against brute force attacks
3. **Log security events** - Monitor for suspicious activity
4. **Require strong passwords** - Enforce password complexity
5. **Use HTTPS in production** - Encrypt all communications

### Permissions

1. **Follow principle of least privilege** - Give users only what they need
2. **Use role-based access** - Group common permissions into roles
3. **Document permissions** - Clearly describe what each permission allows
4. **Test authorization** - Verify permission checks work correctly
5. **Audit regularly** - Review user permissions periodically

### Activity Logging

1. **Log important actions** - User changes, security events, errors
2. **Include context** - IP address, user agent, metadata
3. **Use appropriate severity** - Categorize log importance
4. **Clean old logs** - Remove logs after retention period
5. **Monitor patterns** - Look for anomalies and suspicious activity

---

## 🚨 Troubleshooting

### Common Issues

**Email not sending?**

- Check Gmail app password configuration
- Verify SMTP credentials in `.env`
- Check spam folder
- Review server logs for errors
- 📖 [Troubleshooting Guide →](./PASSWORD_RESET_SETUP.md#troubleshooting)

**Rate limit hit during testing?**

- Clear rate limit logs from database
- Adjust limits in development environment
- Use different IP addresses
- 📖 [Testing Guide →](./RATE_LIMITING.md#testing--troubleshooting)

**Permissions not working?**

- Verify user has correct role assigned
- Check role includes required permission
- Ensure middleware is applied to route
- 📖 [Permissions Guide →](./PERMISSIONS_GUIDE.md)

---

## 📝 License

This boilerplate is provided as-is for use in your projects. Modify and extend as needed for your specific use case.

---

## 🤝 Contributing

Found an issue or want to improve the documentation?

1. Check existing documentation for answers
2. Review code comments and implementation
3. Test thoroughly before asking questions
4. Provide clear reproduction steps for bugs

---

## 📚 Additional Resources

- **SvelteKit Documentation** - https://kit.svelte.dev/docs
- **Drizzle ORM** - https://orm.drizzle.team/docs/overview
- **Lucia Auth** - https://lucia-auth.com/ (session management)
- **FontAwesome Icons** - https://fontawesome.com/icons

---

**Last Updated**: November 2025
