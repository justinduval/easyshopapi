/**
 * Script de test pour vérifier l'upload R2
 * Usage: node test-r2-upload.js
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

console.log('🔍 Configuration R2:');
console.log('Account ID:', R2_ACCOUNT_ID);
console.log('Bucket:', R2_BUCKET_NAME);
console.log('Public URL:', R2_PUBLIC_URL);
console.log('');

const s3Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

async function testR2() {
	try {
		console.log('📋 Liste des fichiers dans le bucket:');
		const listCommand = new ListObjectsV2Command({
			Bucket: R2_BUCKET_NAME,
			MaxKeys: 10
		});

		const listResult = await s3Client.send(listCommand);

		if (listResult.Contents && listResult.Contents.length > 0) {
			console.log(`Trouvé ${listResult.Contents.length} fichier(s):\n`);
			listResult.Contents.forEach((item, index) => {
				const publicUrl = `${R2_PUBLIC_URL}/${item.Key}`;
				console.log(`${index + 1}. ${item.Key}`);
				console.log(`   Taille: ${item.Size} bytes`);
				console.log(`   URL publique: ${publicUrl}`);
				console.log('');
			});

			// Test d'accès à la première image
			if (listResult.Contents.length > 0) {
				const firstImageUrl = `${R2_PUBLIC_URL}/${listResult.Contents[0].Key}`;
				console.log('\n🌐 Test d\'accès HTTP à la première image:');
				console.log('URL:', firstImageUrl);

				try {
					const response = await fetch(firstImageUrl);
					console.log('Status:', response.status, response.statusText);
					console.log('Content-Type:', response.headers.get('content-type'));

					if (response.status === 200) {
						console.log('✅ L\'image est accessible publiquement !');
					} else if (response.status === 403) {
						console.log('❌ Erreur 403: Le bucket n\'est pas configuré pour l\'accès public');
						console.log('\n📝 Action requise:');
						console.log('1. Allez dans le dashboard Cloudflare R2');
						console.log('2. Sélectionnez le bucket "cepmr"');
						console.log('3. Settings > Public access > Allow Access');
						console.log('4. Configurez le custom domain: r2.cepmr.re');
					} else {
						console.log('⚠️  Erreur HTTP:', response.status);
					}
				} catch (fetchError) {
					console.log('❌ Erreur lors du test d\'accès:', fetchError.message);
				}
			}
		} else {
			console.log('Aucun fichier trouvé dans le bucket.');
			console.log('\n💡 Testez l\'upload en créant un produit avec une image.');
		}

	} catch (error) {
		console.error('❌ Erreur:', error.message);
		console.error('\nDétails:', error);
	}
}

testR2();
