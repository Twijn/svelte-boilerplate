import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

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
 * Save uploaded file to disk
 */
export async function saveUploadedFile(
	file: File,
	directory: string = 'uploads/avatars'
): Promise<UploadResult> {
	try {
		// Validate file type
		if (!isValidImageType(file)) {
			return {
				success: false,
				error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
			};
		}

		// Validate file size (5MB)
		if (!isValidFileSize(file, 5 * 1024 * 1024)) {
			return {
				success: false,
				error: 'File size too large. Maximum size is 5MB.'
			};
		}

		// Create directory if it doesn't exist
		const uploadDir = join(process.cwd(), 'static', directory);
		await mkdir(uploadDir, { recursive: true });

		// Generate unique filename
		const filename = generateUniqueFilename(file.name);
		const filepath = join(uploadDir, filename);

		// Convert File to Buffer and save
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(filepath, buffer);

		// Return the public URL path
		const url = `/${directory}/${filename}`;

		return {
			success: true,
			filename,
			path: filepath,
			url
		};
	} catch (error) {
		console.error('File upload error:', error);
		return {
			success: false,
			error: 'Failed to upload file. Please try again.'
		};
	}
}

/**
 * Delete uploaded file from disk
 */
export async function deleteUploadedFile(filePath: string): Promise<boolean> {
	try {
		const fs = await import('fs/promises');
		await fs.unlink(join(process.cwd(), 'static', filePath));
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
