# SvelteKit Authentication & Authorization Boilerplate

A production-ready SvelteKit boilerplate with comprehensive authentication, authorization, and user management features. Perfect for building secure web applications with minimal setup.

## ✨ Features

### 🔐 Authentication

- **User Registration & Login** - Email/password authentication with secure session management
- **Two-Factor Authentication** - TOTP-based 2FA with backup codes
- **Password Reset** - Email-based password recovery with secure tokens
- **Email Verification** - Verify user email addresses on registration
- **Session Management** - Secure, database-backed sessions with Lucia

### 👥 Authorization

- **Role-Based Access Control** - Assign users to roles with predefined permissions
- **Granular Permissions** - Fine-grained permission checking for specific actions
- **Admin Dashboard** - Manage users, roles, and permissions through a web interface
- **Permission Middleware** - Easily protect routes with permission requirements

### 🛡️ Security

- **Rate Limiting** - IP-based and account-based protection against abuse
- **Account Lockout** - Automatic account locking after failed login attempts
- **Account Disabling** - Admins can disable/enable user accounts with reason tracking
- **Activity Logging** - Comprehensive audit trail of all system actions
- **CSRF Protection** - Built-in cross-site request forgery protection

### 👤 User Management

- **Profile Management** - Users can edit their profile, upload avatars, change passwords
- **Account Deletion** - Self-service account deletion with confirmation
- **User Administration** - Admin interface for managing users and viewing activity
- **File Storage** - Flexible storage supporting local filesystem, AWS S3, and Cloudflare R2

### 📊 Monitoring & Analytics

- **Activity Logs** - Track all user actions, security events, and system operations
- **Admin Statistics** - Dashboard with user counts, activity metrics, and security stats
- **Security Monitoring** - Failed login tracking, rate limit violations, suspicious activity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker (for PostgreSQL)

### Installation

1. **Clone and install dependencies:**

   ```sh
   git clone <your-repo>
   cd svelte-boilerplate
   pnpm install
   ```

2. **Set up environment variables:**

   ```sh
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the database:**

   ```sh
   docker-compose up -d
   ```

4. **Push database schema:**

   ```sh
   pnpm db:push
   ```

5. **Seed initial data:**

   ```sh
   pnpm db:seed
   ```

   This creates:
   - Admin user: `admin` / `Admin123!`
   - Default roles (Super Admin, Admin, User)

6. **Start development server:**

   ```sh
   pnpm dev
   ```

7. **Access the application:**
   - Application: http://localhost:5173
   - Login with admin credentials
   - Admin dashboard: http://localhost:5173/panel/admin

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

- **[📖 Documentation Index](./docs/README.md)** - Complete guide to all features
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to Vercel, Netlify, Railway, Fly.io, VPS, and more
- **[� Storage System](./docs/STORAGE.md)** - Flexible file storage (local, S3, R2)
- **[�🔐 Password Reset Setup](./docs/PASSWORD_RESET_SETUP.md)** - Configure email functionality
- **[✉️ Email Verification](./docs/EMAIL_VERIFICATION.md)** - Enable email verification
- **[🛡️ Rate Limiting](./docs/RATE_LIMITING.md)** - Configure rate limits and account lockout
- **[👥 Permissions Guide](./docs/PERMISSIONS_GUIDE.md)** - Add and manage permissions
- **[📊 Activity Logging](./docs/ACTIVITY_LOGGING.md)** - Track and query user activity

## 🛠️ Development

### Available Scripts

```sh
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Database management
pnpm db:push         # Push schema changes
pnpm db:studio       # Open Drizzle Studio (database GUI)
pnpm db:seed         # Seed initial data

# Code quality
pnpm check           # Type checking
pnpm lint            # Lint code
pnpm format          # Format code with Prettier
```

### Project Structure

```
src/
├── lib/
│   ├── components/      # Svelte components
│   ├── constants/       # Permission definitions, constants
│   ├── server/          # Server-side logic
│   │   ├── auth.ts             # Authentication
│   │   ├── permissions.ts      # Authorization
│   │   ├── activity-log.ts     # Activity logging
│   │   ├── rate-limit.ts       # Rate limiting
│   │   └── db/schema.ts        # Database schema
│   └── stores/          # Client-side stores
├── routes/              # SvelteKit routes
│   ├── login/
│   ├── register/
│   ├── panel/           # Protected user area
│   └── ...
└── docs/                # Documentation
```

## 🎯 Use Cases

This boilerplate is perfect for:

- **SaaS Applications** - Multi-tenant platforms with role-based access
- **Content Management Systems** - Control who can create, edit, and publish
- **Internal Tools** - Employee dashboards with department-based permissions
- **E-commerce Platforms** - Customer accounts with order history
- **Community Platforms** - Forums, social networks with moderation
- **API Services** - Rate-limited API access with usage tracking
- **Admin Panels** - Management interfaces for any application

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://admin:adminpassword@localhost:5432/mydb

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Application
APP_NAME="Your App Name"
PUBLIC_BASE_URL=http://localhost:5173
```

See [Password Reset Setup](./docs/PASSWORD_RESET_SETUP.md) for detailed email configuration.

## 🚢 Deployment

**See the comprehensive [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions on deploying to:**

- Vercel
- Netlify
- Docker
- VPS/Ubuntu Server
- Railway
- Fly.io

### Quick Deploy

1. **Build the application:**

   ```sh
   pnpm build
   ```

2. **Set environment variables** on your hosting platform

3. **Run database migrations:**

   ```sh
   pnpm db:push
   pnpm db:seed
   ```

4. **Start the server:**
   ```sh
   node build
   ```

For more deployment options, see the [SvelteKit adapters documentation](https://kit.svelte.dev/docs/adapters).

## 📝 License

This project is provided as-is for use in your own applications. Modify and extend as needed.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

- Check the [documentation](./docs/README.md) for detailed guides
- Review the [troubleshooting section](./docs/README.md#-troubleshooting)
- Look at code comments for implementation details
