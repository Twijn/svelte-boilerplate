# Deployment Guides

This document provides step-by-step deployment instructions for various hosting platforms.

## Table of Contents

- [General Prerequisites](#general-prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Docker Deployment](#docker-deployment)
- [VPS/Ubuntu Server Deployment](#vpsubuntu-server-deployment)
- [Railway Deployment](#railway-deployment)
- [Fly.io Deployment](#flyio-deployment)
- [Post-Deployment Setup](#post-deployment-setup)

---

## General Prerequisites

Before deploying to any platform, ensure you have:

1. **Production Database** - PostgreSQL instance (not the local Docker container)
2. **Environment Variables** - All required variables configured
3. **Email Service** - Gmail or SMTP credentials for password reset/verification
4. **Build Test** - Verify the app builds successfully locally:
   ```sh
   pnpm build
   pnpm preview
   ```

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Application
APP_NAME="Your App Name"
PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
```

---

## Vercel Deployment

### 1. Install Vercel Adapter

```sh
pnpm remove @sveltejs/adapter-auto
pnpm add -D @sveltejs/adapter-vercel
```

### 2. Update svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x'
		})
	}
};

export default config;
```

### 3. Deploy via Vercel CLI

```sh
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add APP_NAME
vercel env add PUBLIC_BASE_URL

# Deploy to production
vercel --prod
```

### 4. Or Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Configure environment variables in project settings
5. Deploy

### 5. Database Setup

Using **Vercel Postgres** or **Neon**:

```sh
# Get database URL from your provider
# Add to Vercel environment variables

# Run migrations (one-time)
vercel env pull .env.production.local
pnpm db:push
pnpm db:seed
```

**Important:** For file uploads (avatars), use Vercel Blob Storage or external storage like S3, as Vercel's filesystem is read-only.

---

## Netlify Deployment

### 1. Install Netlify Adapter

```sh
pnpm remove @sveltejs/adapter-auto
pnpm add -D @sveltejs/adapter-netlify
```

### 2. Update svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

### 3. Create netlify.toml

```toml
[build]
  command = "pnpm build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/render"
  status = 200
```

### 4. Deploy via Netlify CLI

```sh
# Install Netlify CLI
pnpm add -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Set environment variables
netlify env:set DATABASE_URL "your-database-url"
netlify env:set GMAIL_USER "your-email@gmail.com"
netlify env:set GMAIL_APP_PASSWORD "your-password"
netlify env:set APP_NAME "Your App Name"
netlify env:set PUBLIC_BASE_URL "https://your-site.netlify.app"

# Deploy
netlify deploy --prod
```

### 5. Or Deploy via GitHub

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Configure environment variables
6. Deploy

---

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Create uploads directory
RUN mkdir -p static/uploads/avatars

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["node", "build"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://admin:adminpassword@db:5432/mydb
      GMAIL_USER: your-email@gmail.com
      GMAIL_APP_PASSWORD: your-app-password
      APP_NAME: 'Your App'
      PUBLIC_BASE_URL: http://localhost:3000
      NODE_ENV: production
    depends_on:
      - db
    volumes:
      - ./static/uploads:/app/static/uploads

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: adminpassword
      POSTGRES_DB: mydb
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3. Build and Deploy

```sh
# Build image
docker build -t svelte-boilerplate .

# Run with docker-compose
docker-compose up -d

# Run migrations (one-time)
docker-compose exec app pnpm db:push
docker-compose exec app pnpm db:seed

# View logs
docker-compose logs -f app
```

---

## VPS/Ubuntu Server Deployment

### 1. Server Setup

```sh
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo corepack enable
sudo corepack prepare pnpm@latest --activate

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Database Setup

```sh
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE mydb;
CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
\q
```

### 3. Deploy Application

```sh
# Clone repository
cd /var/www
sudo git clone <your-repo> svelte-boilerplate
cd svelte-boilerplate

# Install dependencies
sudo pnpm install

# Create .env file
sudo nano .env
# Add your environment variables

# Build application
sudo pnpm build

# Run migrations
sudo pnpm db:push
sudo pnpm db:seed

# Create uploads directory
sudo mkdir -p static/uploads/avatars
sudo chown -R www-data:www-data static/uploads
```

### 4. Configure PM2

```sh
# Create ecosystem file
sudo nano ecosystem.config.js
```

```javascript
module.exports = {
	apps: [
		{
			name: 'svelte-boilerplate',
			script: 'build/index.js',
			cwd: '/var/www/svelte-boilerplate',
			env: {
				NODE_ENV: 'production',
				PORT: 3000
			}
		}
	]
};
```

```sh
# Start with PM2
sudo pm2 start ecosystem.config.js

# Save PM2 configuration
sudo pm2 save

# Setup PM2 to start on boot
sudo pm2 startup
```

### 5. Configure Nginx

```sh
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/svelte-boilerplate
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

```sh
# Enable site
sudo ln -s /etc/nginx/sites-available/svelte-boilerplate /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt

```sh
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
```

---

## Railway Deployment

### 1. Install Railway CLI

```sh
npm install -g @railway/cli
```

### 2. Login and Initialize

```sh
# Login
railway login

# Create new project
railway init

# Add PostgreSQL
railway add --plugin postgresql
```

### 3. Configure Adapter

Use **adapter-node** for Railway:

```sh
pnpm remove @sveltejs/adapter-auto
pnpm add -D @sveltejs/adapter-node
```

Update `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

### 4. Set Environment Variables

```sh
# Railway automatically provides DATABASE_URL from the PostgreSQL plugin
# Add other variables manually
railway variables set GMAIL_USER=your-email@gmail.com
railway variables set GMAIL_APP_PASSWORD=your-password
railway variables set APP_NAME="Your App"
# PUBLIC_BASE_URL will be your Railway URL
```

### 5. Deploy

```sh
# Deploy
railway up

# Run migrations
railway run pnpm db:push
railway run pnpm db:seed

# Get deployment URL
railway open
```

---

## Fly.io Deployment

### 1. Install Fly CLI

```sh
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

### 2. Login and Launch

```sh
# Login
flyctl auth login

# Launch app
flyctl launch
```

### 3. Create fly.toml

The launch command creates this, but here's a template:

```toml
app = "your-app-name"
primary_region = "sea"

[build]

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### 4. Add PostgreSQL

```sh
# Create Postgres cluster
flyctl postgres create

# Attach to your app
flyctl postgres attach <postgres-app-name>
```

### 5. Set Secrets

```sh
flyctl secrets set GMAIL_USER=your-email@gmail.com
flyctl secrets set GMAIL_APP_PASSWORD=your-password
flyctl secrets set APP_NAME="Your App"
# DATABASE_URL is automatically set when you attach Postgres
```

### 6. Configure Adapter

Use **adapter-node**:

```sh
pnpm remove @sveltejs/adapter-auto
pnpm add -D @sveltejs/adapter-node
```

Update `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

### 7. Deploy

```sh
# Deploy
flyctl deploy

# Run migrations via SSH
flyctl ssh console
cd /app
node -e "require('./build/server/seed.js')"

# Or run locally connected to production DB
flyctl proxy 5432 -a <postgres-app-name>
# In another terminal:
DATABASE_URL=<your-postgres-url> pnpm db:push
DATABASE_URL=<your-postgres-url> pnpm db:seed
```

---

## Post-Deployment Setup

### 1. Run Migrations

After deploying, run database migrations:

```sh
# Using the platform's CLI or SSH
pnpm db:push
pnpm db:seed
```

### 2. Create Admin User

The seed script creates a default admin user:

- Username: `admin`
- Password: `Admin123!`

**Important:** Change this password immediately after first login!

### 3. Configure Email

Test email functionality:

1. Try "Forgot Password" flow
2. Register a new user and check verification email
3. Check spam folder if emails don't arrive

### 4. File Uploads

For avatar uploads, ensure:

- `static/uploads/avatars` directory exists and is writable
- For serverless platforms (Vercel, Netlify), use external storage:
  - AWS S3
  - Cloudinary
  - Vercel Blob
  - Uploadthing

### 5. Security Checklist

- [ ] Change default admin password
- [ ] Set strong `DATABASE_URL` password
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Review rate limit settings in admin panel
- [ ] Set up monitoring/logging
- [ ] Configure backups for database
- [ ] Test 2FA functionality

### 6. Monitoring

Set up monitoring for:

- Application uptime
- Database connections
- Failed login attempts
- Rate limit violations
- Email delivery failures

### 7. Backups

Configure automatic database backups:

- **Vercel Postgres:** Built-in point-in-time recovery
- **Railway:** Automated daily backups
- **Fly.io Postgres:** Configure with `flyctl postgres backup`
- **VPS:** Set up `pg_dump` cron jobs

```sh
# Example backup script for VPS
0 2 * * * pg_dump -U myuser mydb > /backups/db-$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

### Build Failures

```sh
# Clear cache and rebuild
rm -rf .svelte-kit node_modules
pnpm install
pnpm build
```

### Database Connection Issues

- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check database is accessible from deployment platform
- Ensure firewall allows connections
- Test connection locally with production database

### Email Not Sending

- Verify Gmail App Password (not regular password)
- Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- Enable "Less secure app access" if using regular Gmail (not recommended)
- Consider using a dedicated email service like SendGrid, Postmark

### File Upload Issues

- Check directory permissions: `chmod 755 static/uploads`
- For serverless, implement external storage adapter
- Verify `client_max_body_size` in Nginx config

### Performance Issues

- Enable database connection pooling
- Add Redis for session storage
- Configure CDN for static assets
- Optimize database queries with indexes

---

## Additional Resources

- [SvelteKit Adapters](https://kit.svelte.dev/docs/adapters)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Netlify Deployment Docs](https://docs.netlify.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Railway Documentation](https://docs.railway.app/)
- [Fly.io Documentation](https://fly.io/docs/)
