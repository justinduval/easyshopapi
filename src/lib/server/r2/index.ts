import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
	R2_ACCOUNT_ID,
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
	R2_BUCKET_NAME,
	R2_PUBLIC_URL
} from '$env/static/private';

const s3Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

export interface UploadResult {
	url: string;
	key: string;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile(
	file: File,
	folder: string = 'products'
): Promise<UploadResult> {
	try {
		// Generate unique filename
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const ext = file.name.split('.').pop();
		const key = `${folder}/${timestamp}-${randomString}.${ext}`;

		// Convert File to Buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to R2
		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: file.type
		});

		await s3Client.send(command);

		// Return public URL
		const url = `${R2_PUBLIC_URL}/${key}`;

		return { url, key };
	} catch (error) {
		console.error('R2 upload error:', error);
		throw new Error('Failed to upload file to R2');
	}
}

/**
 * Upload multiple files to R2
 */
export async function uploadMultipleFiles(
	files: File[],
	folder: string = 'products'
): Promise<UploadResult[]> {
	const uploadPromises = files.map((file) => uploadFile(file, folder));
	return await Promise.all(uploadPromises);
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
	try {
		const command = new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key
		});

		await s3Client.send(command);
	} catch (error) {
		console.error('R2 delete error:', error);
		throw new Error('Failed to delete file from R2');
	}
}

/**
 * Delete multiple files from R2
 */
export async function deleteMultipleFiles(keys: string[]): Promise<void> {
	const deletePromises = keys.map((key) => deleteFile(key));
	await Promise.all(deletePromises);
}

/**
 * Generate a presigned URL for direct upload from browser
 */
export async function generatePresignedUrl(
	filename: string,
	contentType: string,
	folder: string = 'products'
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
	try {
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const ext = filename.split('.').pop();
		const key = `${folder}/${timestamp}-${randomString}.${ext}`;

		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			ContentType: contentType
		});

		const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
		const publicUrl = `${R2_PUBLIC_URL}/${key}`;

		return { uploadUrl, key, publicUrl };
	} catch (error) {
		console.error('R2 presigned URL error:', error);
		throw new Error('Failed to generate presigned URL');
	}
}

/**
 * Extract R2 key from public URL
 */
export function extractKeyFromUrl(url: string): string {
	return url.replace(`${R2_PUBLIC_URL}/`, '');
}
