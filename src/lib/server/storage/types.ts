export interface StorageAdapter {
	/**
	 * Upload a file to storage
	 * @param file - The file buffer or stream
	 * @param path - The path where the file should be stored (e.g., 'avatars/user-123.jpg')
	 * @param options - Additional upload options
	 * @returns The URL to access the uploaded file
	 */
	upload(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult>;

	/**
	 * Delete a file from storage
	 * @param path - The path to the file to delete
	 */
	delete(path: string): Promise<void>;

	/**
	 * Get a URL to access a file
	 * @param path - The path to the file
	 * @param options - URL generation options (e.g., expiration for signed URLs)
	 */
	getUrl(path: string, options?: UrlOptions): Promise<string>;

	/**
	 * Check if a file exists
	 * @param path - The path to check
	 */
	exists(path: string): Promise<boolean>;
}

export interface UploadOptions {
	contentType?: string;
	metadata?: Record<string, string>;
	maxSize?: number; // In bytes
}

export interface UploadResult {
	path: string; // Storage path
	url: string; // Public URL to access the file
	size: number; // File size in bytes
}

export interface UrlOptions {
	expiresIn?: number; // Seconds until URL expires (for signed URLs)
}

export interface FileValidation {
	maxSize?: number; // Max file size in bytes
	allowedMimeTypes?: string[]; // e.g., ['image/jpeg', 'image/png']
	allowedExtensions?: string[]; // e.g., ['.jpg', '.png']
}

export class StorageError extends Error {
	constructor(
		message: string,
		public code: string
	) {
		super(message);
		this.name = 'StorageError';
	}
}
