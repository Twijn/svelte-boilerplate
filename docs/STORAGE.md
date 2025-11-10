# Storage System Guide

The boilerplate includes a flexible storage system that supports multiple backends (local filesystem, AWS S3, Cloudflare R2) through a unified interface. This allows you to switch storage providers without changing your application code.

## Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [Usage](#usage)
- [Storage Adapters](#storage-adapters)
- [File Validation](#file-validation)
- [Migration Guide](#migration-guide)

## Overview

The storage system uses the **Adapter Pattern** to provide a consistent interface across different storage backends:

- **Local Storage**: Store files on the filesystem (perfect for VPS/Docker deployments)
- **AWS S3**: Store files in Amazon S3 or S3-compatible services
- **Cloudflare R2**: Store files in Cloudflare R2 (S3-compatible, zero egress fees)

### Architecture

```
UploadManager (facade)
    ↓
StorageAdapter (interface)
    ├── LocalStorageAdapter
    ├── S3StorageAdapter
    └── R2StorageAdapter
```

## Configuration

### Environment Variables

Set `STORAGE_PROVIDER` to choose your storage backend:

```bash
# .env
STORAGE_PROVIDER=local  # or 's3' or 'r2'
```

### Local Storage (Default)

No additional configuration needed. Files are stored in `static/uploads/`.

```bash
STORAGE_PROVIDER=local
```

### AWS S3

```bash
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional: Use CloudFront or custom domain for public URLs
AWS_S3_PUBLIC_URL=https://cdn.yourdomain.com
```

### Cloudflare R2

```bash
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your-account-id
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key

# Optional: Use R2 public bucket domain
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## Usage

### Pre-configured Managers

The easiest way to use the storage system is with pre-configured upload managers:

```typescript
import { avatarUploadManager, documentUploadManager } from '$lib/server/storage';

// Upload an avatar (max 5MB, images only)
const result = await avatarUploadManager.upload(buffer, 'avatars/user-123.jpg', {
	contentType: 'image/jpeg'
});

// Upload a document (max 10MB, PDF/Word only)
const result = await documentUploadManager.upload(buffer, 'documents/invoice.pdf', {
	contentType: 'application/pdf'
});
```

### Custom Upload Manager

Create a custom upload manager with your own validation rules:

```typescript
import { createUploadManager } from '$lib/server/storage';

const videoUploadManager = createUploadManager({
	maxSize: 100 * 1024 * 1024, // 100MB
	allowedMimeTypes: ['video/mp4', 'video/webm'],
	allowedExtensions: ['.mp4', '.webm']
});

const result = await videoUploadManager.upload(buffer, 'videos/demo.mp4', {
	contentType: 'video/mp4',
	metadata: {
		uploadedBy: 'user-123',
		title: 'Demo Video'
	}
});
```

### Direct Usage

For maximum flexibility, use the UploadManager class directly:

```typescript
import { UploadManager } from '$lib/server/storage';

const manager = new UploadManager();

// Upload
const result = await manager.upload(buffer, 'path/to/file.jpg');
// Returns: { path: string, url: string, size: number }

// Delete
await manager.delete('path/to/file.jpg');

// Get URL (may be signed/temporary for private buckets)
const url = await manager.getUrl('path/to/file.jpg', { expiresIn: 3600 });

// Check existence
const exists = await manager.exists('path/to/file.jpg');

// Get current provider
const provider = manager.getProvider(); // 'local' | 's3' | 'r2'
```

## Storage Adapters

### LocalStorageAdapter

Stores files in the local filesystem under `static/uploads/`.

**Use cases:**

- Development
- VPS/dedicated server deployments
- Docker deployments with persistent volumes
- Small applications with low traffic

**Pros:**

- Simple setup
- No external dependencies
- Fast local access
- No storage costs

**Cons:**

- Doesn't work on serverless platforms (Vercel, Netlify)
- No built-in CDN
- Backups are your responsibility
- Not suitable for horizontal scaling

### S3StorageAdapter

Stores files in AWS S3 or S3-compatible services.

**Use cases:**

- Production deployments
- High-traffic applications
- Serverless platforms (Vercel, Netlify)
- Multi-region deployments

**Pros:**

- Highly reliable (99.999999999% durability)
- Built-in redundancy
- Scales automatically
- Integrates with CloudFront CDN
- Versioning and lifecycle policies

**Cons:**

- Monthly storage costs
- Data transfer (egress) fees
- Requires AWS account setup

**Compatible services:**

- Amazon S3
- DigitalOcean Spaces
- MinIO (self-hosted)
- Backblaze B2 (via S3 API)

### R2StorageAdapter

Stores files in Cloudflare R2 (S3-compatible).

**Use cases:**

- Production deployments
- Cost-conscious applications (no egress fees)
- Applications already using Cloudflare

**Pros:**

- S3-compatible API (easy migration)
- **Zero egress fees** (major cost savings)
- Fast global access via Cloudflare network
- Generous free tier (10 GB storage, 1M requests/month)

**Cons:**

- Cloudflare-specific (less portable than S3)
- Newer service (launched 2022)

## File Validation

The storage system includes built-in file validation:

### Validation Rules

```typescript
interface FileValidation {
	maxSize?: number; // Maximum file size in bytes
	allowedMimeTypes?: string[]; // Allowed MIME types
	allowedExtensions?: string[]; // Allowed file extensions
}
```

### Example

```typescript
const manager = createUploadManager({
	maxSize: 5 * 1024 * 1024, // 5MB
	allowedMimeTypes: ['image/jpeg', 'image/png'],
	allowedExtensions: ['.jpg', '.jpeg', '.png']
});

// This will throw a StorageError if validation fails
await manager.upload(buffer, 'image.jpg', { contentType: 'image/jpeg' });
```

### Error Handling

```typescript
import { StorageError } from '$lib/server/storage';

try {
	await manager.upload(buffer, 'file.txt');
} catch (error) {
	if (error instanceof StorageError) {
		switch (error.code) {
			case 'FILE_TOO_LARGE':
				// Handle file size error
				break;
			case 'INVALID_FILE_TYPE':
				// Handle MIME type error
				break;
			case 'INVALID_FILE_EXTENSION':
				// Handle extension error
				break;
			case 'UPLOAD_FAILED':
				// Handle upload failure
				break;
		}
	}
}
```

## Migration Guide

### From Old File Upload System

The boilerplate previously used a simple filesystem-based upload system. To migrate:

**Old code:**

```typescript
import { saveUploadedFile, deleteUploadedFile } from '$lib/server/file-upload';

const result = await saveUploadedFile(file, 'uploads/avatars');
await deleteUploadedFile('/uploads/avatars/file.jpg');
```

**New code (already migrated):**

```typescript
import { saveUploadedFile, deleteUploadedFile } from '$lib/server/file-upload';

// Same API - no changes needed!
const result = await saveUploadedFile(file, 'avatars');
await deleteUploadedFile('avatars/file.jpg');
```

The `file-upload.ts` module has been updated to use the new storage system internally, so existing code continues to work.

### Switching Storage Providers

To switch from local storage to cloud storage:

1. **Update environment variables:**

   ```bash
   # Change from
   STORAGE_PROVIDER=local

   # To
   STORAGE_PROVIDER=s3
   AWS_S3_BUCKET=my-bucket
   AWS_S3_REGION=us-east-1
   # ... other S3 vars
   ```

2. **Migrate existing files (optional):**

   ```bash
   # Use AWS CLI to upload existing files
   aws s3 sync static/uploads/ s3://my-bucket/
   ```

3. **Update database URLs (if needed):**
   ```sql
   -- If storing full URLs in database
   UPDATE users
   SET avatar = REPLACE(avatar, '/uploads/', 'https://my-bucket.s3.amazonaws.com/')
   WHERE avatar LIKE '/uploads/%';
   ```

### Best Practices

1. **Use relative paths**: Store paths like `avatars/user-123.jpg` instead of full URLs
2. **Generate URLs dynamically**: Use `manager.getUrl()` to get current URLs
3. **Validate early**: Apply validation rules in your upload manager
4. **Handle errors gracefully**: Catch `StorageError` and provide user feedback
5. **Test locally**: Use local storage during development, cloud in production

### Example: SvelteKit Form Action

```typescript
// src/routes/profile/+page.server.ts
import { avatarUploadManager } from '$lib/server/storage';

export const actions = {
	uploadAvatar: async ({ request, locals }) => {
		const formData = await request.formData();
		const file = formData.get('avatar') as File;

		if (!file || file.size === 0) {
			return { success: false, error: 'No file provided' };
		}

		try {
			const buffer = Buffer.from(await file.arrayBuffer());
			const path = `avatars/${locals.user.id}.${file.name.split('.').pop()}`;

			const result = await avatarUploadManager.upload(buffer, path, {
				contentType: file.type
			});

			// Update user record with new avatar URL
			await db.update(users).set({ avatar: result.path }).where(eq(users.id, locals.user.id));

			return { success: true, url: result.url };
		} catch (error) {
			console.error('Upload error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Upload failed'
			};
		}
	}
};
```

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Deployment Guide](./DEPLOYMENT.md) - Platform-specific storage recommendations
