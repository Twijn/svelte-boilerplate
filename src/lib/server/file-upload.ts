import { randomBytes } from 'crypto';
import { avatarUploadManager } from './storage';

export interface UploadResult {
	success: boolean;
	filename?: string;
	path?: string;
	url?: string;
	error?: string;
}

/**
 * Validate file type
 */
export function isValidImageType(file: File): boolean {
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
	return validTypes.includes(file.type);
}

/**
 * Validate file size (default 5MB)
 */
export function isValidFileSize(file: File, maxSizeBytes: number = 5 * 1024 * 1024): boolean {
	return file.size <= maxSizeBytes;
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
	const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
	const randomString = randomBytes(16).toString('hex');
	const timestamp = Date.now();
	return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Save uploaded file using storage manager
 */
export async function saveUploadedFile(
	file: File,
	directory: string = 'avatars'
): Promise<UploadResult> {
	try {
		// Generate unique filename
		const filename = generateUniqueFilename(file.name);
		const path = `${directory}/${filename}`;

		// Convert File to Buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload using storage manager (handles validation automatically)
		const result = await avatarUploadManager.upload(buffer, path, {
			contentType: file.type
		});

		return {
			success: true,
			filename,
			path: result.path,
			url: result.url
		};
	} catch (error) {
		console.error('File upload error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to upload file. Please try again.'
		};
	}
}

/**
 * Delete uploaded file using storage manager
 */
export async function deleteUploadedFile(filePath: string): Promise<boolean> {
	try {
		await avatarUploadManager.delete(filePath);
		return true;
	} catch (error) {
		console.error('File deletion error:', error);
		return false;
	}
}

/**
 * Extract file from FormData
 */
export function getFileFromFormData(formData: FormData, fieldName: string): File | null {
	const file = formData.get(fieldName);
	if (file instanceof File && file.size > 0) {
		return file;
	}
	return null;
}
