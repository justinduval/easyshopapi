import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VENV_REMBG = path.join(__dirname, '..', 'venv', 'bin', 'rembg');
const INPUT_DIR = path.join(__dirname, '..', 'a_integrer');
const TEMP_DIR = path.join(__dirname, '..', 'temp_images');

const IMAGE_FOLDERS = ['photos-batteries', 'photos-lubrifiants', 'photos-pneus'];

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID!,
		secretAccessKey: R2_SECRET_ACCESS_KEY!
	}
});

interface ProcessResult {
	success: boolean;
	reference: string;
	originalPath: string;
	r2Url?: string;
	error?: string;
}

// Extract reference from filename (e.g., "BAT REF A0027302.png" -> "A0027302")
function extractReference(filename: string): string | null {
	// Patterns to match:
	// "BAT REF A0027302.png"
	// "HUILE REF A0001013.webp"
	// "REF A0002897.jpg"
	// "HUILEREF A0004368.jpg" (no space)
	const patterns = [
		/(?:BAT\s*)?(?:HUILE\s*)?REF\s*(A\d+)/i,
		/^(A\d+)\./i
	];

	for (const pattern of patterns) {
		const match = filename.match(pattern);
		if (match) {
			return match[1].toUpperCase();
		}
	}

	return null;
}

// Remove background using rembg
async function removeBackground(inputPath: string, outputPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const proc = spawn(VENV_REMBG, ['i', inputPath, outputPath]);

		let stderr = '';
		proc.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`rembg failed with code ${code}: ${stderr}`));
			}
		});

		proc.on('error', (err) => {
			reject(err);
		});
	});
}

// Convert image to webp buffer using sharp
async function convertToWebpBuffer(inputPath: string): Promise<Buffer> {
	return sharp(inputPath)
		.webp({ quality: 85 })
		.resize(800, 800, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.toBuffer();
}

// Upload to R2
async function uploadToR2(buffer: Buffer, key: string): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
		Body: buffer,
		ContentType: 'image/webp'
	});

	await s3Client.send(command);
	return `${R2_PUBLIC_URL}/${key}`;
}

async function processImage(inputPath: string): Promise<ProcessResult> {
	const filename = path.basename(inputPath);
	const reference = extractReference(filename);

	if (!reference) {
		return {
			success: false,
			reference: 'UNKNOWN',
			originalPath: inputPath,
			error: `Could not extract reference from: ${filename}`
		};
	}

	const tempPath = path.join(TEMP_DIR, `temp_${reference}.png`);
	const r2Key = `products/${reference}.webp`;

	try {
		// Step 1: Remove background
		console.log(`  [1/3] Removing background...`);
		await removeBackground(inputPath, tempPath);

		// Step 2: Convert to webp
		console.log(`  [2/3] Converting to webp...`);
		const webpBuffer = await convertToWebpBuffer(tempPath);

		// Step 3: Upload to R2
		console.log(`  [3/3] Uploading to R2...`);
		const r2Url = await uploadToR2(webpBuffer, r2Key);

		// Clean up temp file
		if (fs.existsSync(tempPath)) {
			fs.unlinkSync(tempPath);
		}

		return {
			success: true,
			reference,
			originalPath: inputPath,
			r2Url
		};
	} catch (error: any) {
		// Clean up temp file on error
		if (fs.existsSync(tempPath)) {
			fs.unlinkSync(tempPath);
		}

		return {
			success: false,
			reference,
			originalPath: inputPath,
			error: error.message
		};
	}
}

async function processFolder(folderName: string): Promise<ProcessResult[]> {
	const inputDir = path.join(INPUT_DIR, folderName);
	const results: ProcessResult[] = [];

	if (!fs.existsSync(inputDir)) {
		console.log(`Folder not found: ${inputDir}`);
		return results;
	}

	const files = fs.readdirSync(inputDir).filter((file) => {
		const ext = path.extname(file).toLowerCase();
		return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
	});

	console.log(`\nProcessing ${files.length} images from ${folderName}...`);

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const inputPath = path.join(inputDir, file);

		console.log(`\n[${i + 1}/${files.length}] ${file}`);

		const result = await processImage(inputPath);
		results.push(result);

		if (result.success) {
			console.log(`  ✓ Uploaded: ${result.r2Url}`);
		} else {
			console.log(`  ✗ Error: ${result.error}`);
		}
	}

	return results;
}

async function main() {
	console.log('='.repeat(60));
	console.log('Image Processing Script');
	console.log('- Remove background using rembg');
	console.log('- Convert to webp format');
	console.log('- Resize to max 800x800');
	console.log('- Upload to Cloudflare R2');
	console.log('='.repeat(60));

	// Check R2 configuration
	if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
		console.error('\nError: R2 configuration missing in .env file');
		console.error('Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
		process.exit(1);
	}

	console.log(`\nR2 Bucket: ${R2_BUCKET_NAME}`);
	console.log(`R2 Public URL: ${R2_PUBLIC_URL}`);

	// Create temp directory
	if (!fs.existsSync(TEMP_DIR)) {
		fs.mkdirSync(TEMP_DIR, { recursive: true });
	}

	// Check if rembg is available
	if (!fs.existsSync(VENV_REMBG)) {
		console.error(`\nError: rembg not found at ${VENV_REMBG}`);
		console.error('Please install it with: venv/bin/pip install rembg[cli]');
		process.exit(1);
	}

	const allResults: ProcessResult[] = [];

	for (const folder of IMAGE_FOLDERS) {
		const results = await processFolder(folder);
		allResults.push(...results);
	}

	// Clean up temp directory
	if (fs.existsSync(TEMP_DIR)) {
		fs.rmSync(TEMP_DIR, { recursive: true });
	}

	// Summary
	const successful = allResults.filter((r) => r.success);
	const failed = allResults.filter((r) => !r.success);

	console.log('\n' + '='.repeat(60));
	console.log('Summary');
	console.log('='.repeat(60));
	console.log(`✓ Successfully processed: ${successful.length} images`);
	console.log(`✗ Failed: ${failed.length} images`);

	if (failed.length > 0) {
		console.log('\nFailed images:');
		failed.forEach((r) => {
			console.log(`  - ${path.basename(r.originalPath)}: ${r.error}`);
		});
	}

	// Save results to JSON for later use
	const resultsPath = path.join(__dirname, '..', 'image-processing-results.json');
	fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
	console.log(`\nResults saved to: ${resultsPath}`);

	// Create reference mapping (reference -> R2 URL)
	const mapping: Record<string, string> = {};
	successful.forEach((r) => {
		mapping[r.reference] = r.r2Url!;
	});

	const mappingPath = path.join(__dirname, '..', 'reference-mapping.json');
	fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
	console.log(`Reference mapping saved to: ${mappingPath}`);
}

main().catch(console.error);
