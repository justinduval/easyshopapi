import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '..', 'static', 'products');

const s3Client = new S3Client({
	region: 'auto',
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
	}
});

async function uploadToR2(filePath: string, key: string): Promise<string> {
	const buffer = fs.readFileSync(filePath);
	await s3Client.send(new PutObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME,
		Key: key,
		Body: buffer,
		ContentType: 'image/webp'
	}));
	return `${process.env.R2_PUBLIC_URL}/${key}`;
}

async function main() {
	console.log('Upload webp images to R2\n');

	const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.webp') && !f.startsWith('test_'));
	console.log(`Found ${files.length} webp files to upload\n`);

	const mapping: Record<string, string> = {};

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const reference = file.replace('.webp', '');
		const filePath = path.join(INPUT_DIR, file);
		const r2Key = `products/${file}`;

		try {
			const url = await uploadToR2(filePath, r2Key);
			mapping[reference] = url;
			console.log(`[${i + 1}/${files.length}] ✓ ${reference}`);
		} catch (err: any) {
			console.log(`[${i + 1}/${files.length}] ✗ ${reference}: ${err.message}`);
		}
	}

	const mappingPath = path.join(__dirname, '..', 'reference-mapping.json');
	fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
	console.log(`\n✓ Mapping saved: ${mappingPath}`);
	console.log(`✓ Uploaded: ${Object.keys(mapping).length} images`);
}

main().catch(console.error);
