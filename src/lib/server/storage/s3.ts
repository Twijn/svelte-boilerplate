import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	type PutObjectCommandInput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageAdapter, UploadOptions, UploadResult, UrlOptions } from './types';
import { StorageError } from './types';

export interface S3StorageOptions {
	bucket: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	endpoint?: string; // For S3-compatible services
	publicUrl?: string; // For public CDN URLs
}

export class S3StorageAdapter implements StorageAdapter {
	private client: S3Client;
	private bucket: string;
	private publicUrl?: string;

	constructor(options: S3StorageOptions) {
		this.bucket = options.bucket;
		this.publicUrl = options.publicUrl;

		this.client = new S3Client({
			region: options.region,
			credentials: {
				accessKeyId: options.accessKeyId,
				secretAccessKey: options.secretAccessKey
			},
			...(options.endpoint && { endpoint: options.endpoint })
		});
	}

	async upload(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
		try {
			const params: PutObjectCommandInput = {
				Bucket: this.bucket,
				Key: path,
				Body: file,
				ContentType: options?.contentType || 'application/octet-stream',
				// Set aggressive caching since files have unique names
				CacheControl: 'public, max-age=31536000, immutable', // 1 year
				...(options?.metadata && { Metadata: options.metadata })
			};

			await this.client.send(new PutObjectCommand(params));

			const url = this.publicUrl ? `${this.publicUrl}/${path}` : await this.getUrl(path);

			return {
				path,
				url,
				size: file.length
			};
		} catch (error) {
			throw new StorageError(
				`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
				'UPLOAD_FAILED'
			);
		}
	}

	async delete(path: string): Promise<void> {
		try {
			const command = new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: path
			});

			await this.client.send(command);
		} catch (error) {
			throw new StorageError(
				`Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
				'DELETE_FAILED'
			);
		}
	}

	async getUrl(path: string, options?: UrlOptions): Promise<string> {
		if (this.publicUrl) {
			return `${this.publicUrl}/${path}`;
		}

		try {
			const command = new HeadObjectCommand({
				Bucket: this.bucket,
				Key: path
			});

			const expiresIn = options?.expiresIn || 3600; // Default 1 hour
			return await getSignedUrl(this.client, command, { expiresIn });
		} catch (error) {
			throw new StorageError(
				`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
				'URL_GENERATION_FAILED'
			);
		}
	}

	async exists(path: string): Promise<boolean> {
		try {
			const command = new HeadObjectCommand({
				Bucket: this.bucket,
				Key: path
			});

			await this.client.send(command);
			return true;
		} catch {
			// HeadObject throws error if object doesn't exist
			return false;
		}
	}
}
