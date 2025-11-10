import { S3StorageAdapter } from './s3';

export interface R2StorageOptions {
	accountId: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	publicUrl?: string; // For R2 public bucket URLs
}

/**
 * Cloudflare R2 Storage Adapter
 *
 * R2 is S3-compatible, so we extend the S3 adapter with R2-specific configuration.
 * The main difference is the endpoint URL format.
 */
export class R2StorageAdapter extends S3StorageAdapter {
	constructor(options: R2StorageOptions) {
		const endpoint = `https://${options.accountId}.r2.cloudflarestorage.com`;

		super({
			bucket: options.bucket,
			region: 'auto', // R2 doesn't use regions, but S3 SDK requires it
			accessKeyId: options.accessKeyId,
			secretAccessKey: options.secretAccessKey,
			endpoint,
			publicUrl: options.publicUrl
		});
	}
}
