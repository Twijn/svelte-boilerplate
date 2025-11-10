import { env } from '$env/dynamic/private';
import type { StorageAdapter, UploadOptions, UploadResult, FileValidation } from './types';
import { StorageError } from './types';
import { LocalStorageAdapter } from './local';
import { S3StorageAdapter } from './s3';
import { R2StorageAdapter } from './r2';

type StorageProvider = 'local' | 's3' | 'r2';

/**
 * Upload Manager - Main interface for file storage operations
 *
 * Provides a unified interface for file uploads regardless of storage backend.
 * Automatically selects the appropriate adapter based on environment configuration.
 *
 * Environment Variables:
 * - STORAGE_PROVIDER: 'local' | 's3' | 'r2' (default: 'local')
 *
 * For S3:
 * - AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * - AWS_S3_PUBLIC_URL (optional, for CDN)
 *
 * For R2:
 * - R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 * - R2_PUBLIC_URL (optional, for public buckets)
 */
export class UploadManager {
	private adapter: StorageAdapter;
	private validation?: FileValidation;

	constructor(validation?: FileValidation) {
		this.validation = validation;
		this.adapter = this.createAdapter();
	}

	private createAdapter(): StorageAdapter {
		const provider = (env.STORAGE_PROVIDER || 'local') as StorageProvider;

		switch (provider) {
			case 's3':
				return new S3StorageAdapter({
					bucket: env.AWS_S3_BUCKET || '',
					region: env.AWS_S3_REGION || 'us-east-1',
					accessKeyId: env.AWS_ACCESS_KEY_ID || '',
					secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
					publicUrl: env.AWS_S3_PUBLIC_URL
				});

			case 'r2':
				return new R2StorageAdapter({
					accountId: env.R2_ACCOUNT_ID || '',
					bucket: env.R2_BUCKET || '',
					accessKeyId: env.R2_ACCESS_KEY_ID || '',
					secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
					publicUrl: env.R2_PUBLIC_URL
				});

			case 'local':
			default:
				return new LocalStorageAdapter('static/uploads', '/uploads');
		}
	}

	/**
	 * Validate file before upload
	 */
	private validateFile(file: Buffer, mimeType?: string, fileName?: string): void {
		if (!this.validation) return;

		// Check file size
		if (this.validation.maxSize && file.length > this.validation.maxSize) {
			throw new StorageError(
				`File size (${file.length} bytes) exceeds maximum allowed size (${this.validation.maxSize} bytes)`,
				'FILE_TOO_LARGE'
			);
		}

		// Check MIME type
		if (this.validation.allowedMimeTypes && mimeType) {
			if (!this.validation.allowedMimeTypes.includes(mimeType)) {
				throw new StorageError(
					`MIME type ${mimeType} is not allowed. Allowed types: ${this.validation.allowedMimeTypes.join(', ')}`,
					'INVALID_FILE_TYPE'
				);
			}
		}

		// Check file extension
		if (this.validation.allowedExtensions && fileName) {
			const ext = fileName.split('.').pop()?.toLowerCase();
			if (!ext || !this.validation.allowedExtensions.includes(`.${ext}`)) {
				throw new StorageError(
					`File extension .${ext} is not allowed. Allowed extensions: ${this.validation.allowedExtensions.join(', ')}`,
					'INVALID_FILE_EXTENSION'
				);
			}
		}
	}

	/**
	 * Upload a file to storage
	 */
	async upload(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
		// Extract filename from path for validation
		const fileName = path.split('/').pop();
		this.validateFile(file, options?.contentType, fileName);

		return this.adapter.upload(file, path, options);
	}

	/**
	 * Delete a file from storage
	 */
	async delete(path: string): Promise<void> {
		return this.adapter.delete(path);
	}

	/**
	 * Get URL for a file (may be signed/temporary for private buckets)
	 */
	async getUrl(path: string, options?: { expiresIn?: number }): Promise<string> {
		return this.adapter.getUrl(path, options);
	}

	/**
	 * Check if a file exists
	 */
	async exists(path: string): Promise<boolean> {
		return this.adapter.exists(path);
	}

	/**
	 * Get the current storage provider
	 */
	getProvider(): StorageProvider {
		return (env.STORAGE_PROVIDER || 'local') as StorageProvider;
	}
}

/**
 * Create an upload manager with common validation rules
 */
export function createUploadManager(validation?: FileValidation): UploadManager {
	return new UploadManager(validation);
}

/**
 * Pre-configured upload manager for avatar images
 */
export const avatarUploadManager = createUploadManager({
	maxSize: 5 * 1024 * 1024, // 5MB
	allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
	allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
});

/**
 * Pre-configured upload manager for documents
 */
export const documentUploadManager = createUploadManager({
	maxSize: 10 * 1024 * 1024, // 10MB
	allowedMimeTypes: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	],
	allowedExtensions: ['.pdf', '.doc', '.docx']
});
