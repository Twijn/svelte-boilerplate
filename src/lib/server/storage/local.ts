import { writeFile, unlink, mkdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import type { StorageAdapter, UploadResult } from './types';
import { StorageError } from './types';

export class LocalStorageAdapter implements StorageAdapter {
	private basePath: string;
	private baseUrl: string;

	constructor(basePath: string = 'static/uploads', baseUrl: string = '/uploads') {
		this.basePath = basePath;
		this.baseUrl = baseUrl;
	}

	async upload(file: Buffer, path: string): Promise<UploadResult> {
		try {
			const fullPath = join(this.basePath, path);
			const dir = dirname(fullPath);

			// Create directory if it doesn't exist
			if (!existsSync(dir)) {
				await mkdir(dir, { recursive: true });
			}

			// Write file
			await writeFile(fullPath, file);

			// Get file size
			const stats = await stat(fullPath);

			return {
				path,
				url: this.baseUrl + '/' + path.replace(/\\/g, '/'),
				size: stats.size
			};
		} catch (error) {
			throw new StorageError(
				`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
				'UPLOAD_FAILED'
			);
		}
	}

	async delete(path: string): Promise<void> {
		try {
			const fullPath = join(this.basePath, path);
			if (existsSync(fullPath)) {
				await unlink(fullPath);
			}
		} catch (error) {
			throw new StorageError(
				`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
				'DELETE_FAILED'
			);
		}
	}

	async getUrl(path: string): Promise<string> {
		// Local files don't support expiring URLs
		return this.baseUrl + '/' + path.replace(/\\/g, '/');
	}

	async exists(path: string): Promise<boolean> {
		const fullPath = join(this.basePath, path);
		return existsSync(fullPath);
	}
}
