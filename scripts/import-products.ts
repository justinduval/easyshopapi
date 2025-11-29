import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database pool
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000
});

interface ScrapedProduct {
	slug: string;
	name: string;
	reference: string;
	supplier_reference?: string;
	price: number;
	stock?: number | null;
	image?: string;
	source_url?: string;
	category_id?: string;
}

interface Category {
	id: string;
	name: string;
	slug: string;
	description: string | null;
}

interface Product {
	id: string;
	category_id: string;
	reference: string;
	name: string;
	slug: string;
	description: string;
	price: number;
	tva_rate: number;
	stock_quantity: number;
	images: string[];
	meta_description: string | null;
	status: 'draft' | 'published';
}

interface CategoryMapping {
	filename: string;
	categoryName: string;
	categorySlug: string;
	description: string;
	tvaRate: number;
}

const categories: CategoryMapping[] = [
	{
		filename: 'products-coire.json',
		categoryName: 'Pneus',
		categorySlug: 'pneus',
		description: 'Pneus pour véhicules légers, 4x4, poids lourds, motos et vélos',
		tvaRate: 20
	},
	{
		filename: 'products-lubrifiants.json',
		categoryName: 'Lubrifiants',
		categorySlug: 'lubrifiants',
		description: 'Huiles et lubrifiants pour tous types de véhicules',
		tvaRate: 20
	},
	{
		filename: 'products-batteries.json',
		categoryName: 'Batteries',
		categorySlug: 'batteries',
		description: 'Batteries pour véhicules légers, poids lourds, motos et vélos',
		tvaRate: 20
	}
];

async function getCategoryBySlug(slug: string): Promise<Category | null> {
	const result = await pool.query<Category>('SELECT * FROM categories WHERE slug = $1', [slug]);
	return result.rows[0] || null;
}

async function createCategory(data: {
	name: string;
	slug: string;
	description: string;
}): Promise<Category> {
	const result = await pool.query<Category>(
		`INSERT INTO categories (name, slug, description)
		 VALUES ($1, $2, $3)
		 RETURNING *`,
		[data.name, data.slug, data.description]
	);
	return result.rows[0];
}

async function createProduct(data: {
	category_id: string;
	reference: string;
	name: string;
	slug: string;
	description: string;
	price: number;
	tva_rate: number;
	stock_quantity: number;
	images: string[];
	meta_description: string | null;
	status: 'draft' | 'published';
}): Promise<Product> {
	const result = await pool.query<Product>(
		`INSERT INTO products
		 (category_id, reference, name, slug, description, price, tva_rate, stock_quantity, images, meta_description, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING *`,
		[
			data.category_id,
			data.reference,
			data.name,
			data.slug,
			data.description,
			data.price,
			data.tva_rate,
			data.stock_quantity,
			data.images,
			data.meta_description,
			data.status
		]
	);
	return result.rows[0];
}

async function ensureCategory(categoryMapping: CategoryMapping): Promise<string> {
	let category = await getCategoryBySlug(categoryMapping.categorySlug);

	if (!category) {
		console.log(`Creating category: ${categoryMapping.categoryName}...`);
		category = await createCategory({
			name: categoryMapping.categoryName,
			slug: categoryMapping.categorySlug,
			description: categoryMapping.description
		});
		console.log(`✓ Category created: ${category.name} (${category.id})`);
	} else {
		console.log(`✓ Category exists: ${category.name} (${category.id})`);
	}

	return category.id;
}

async function importProducts() {
	console.log('Starting product import...\n');

	let totalImported = 0;
	let totalSkipped = 0;
	let totalErrors = 0;

	try {
		for (const categoryMapping of categories) {
			console.log(`\n${'='.repeat(60)}`);
			console.log(`Processing: ${categoryMapping.categoryName}`);
			console.log(`${'='.repeat(60)}\n`);

			const categoryId = await ensureCategory(categoryMapping);

			const filePath = path.join(__dirname, '..', categoryMapping.filename);

			if (!fs.existsSync(filePath)) {
				console.log(`⚠ File not found: ${categoryMapping.filename}`);
				continue;
			}

			const productsData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ScrapedProduct[];
			console.log(`Found ${productsData.length} products to import\n`);

			for (let i = 0; i < productsData.length; i++) {
				const scrapedProduct = productsData[i];

				try {
					const productData = {
						category_id: categoryId,
						reference: scrapedProduct.reference || `REF-${scrapedProduct.slug}`,
						name: scrapedProduct.name,
						slug: scrapedProduct.slug,
						description: scrapedProduct.name,
						price: scrapedProduct.price,
						tva_rate: categoryMapping.tvaRate,
						stock_quantity: scrapedProduct.stock || 0,
						images: scrapedProduct.image ? [scrapedProduct.image] : [],
						meta_description: scrapedProduct.name.substring(0, 255),
						status: 'published' as const
					};

					const created = await createProduct(productData);
					totalImported++;
					console.log(`✓ [${i + 1}/${productsData.length}] Imported: ${created.name}`);
				} catch (error: any) {
					if (error?.code === '23505') {
						totalSkipped++;
						console.log(`⊘ [${i + 1}/${productsData.length}] Skipped (duplicate): ${scrapedProduct.name}`);
					} else {
						totalErrors++;
						console.error(
							`✗ [${i + 1}/${productsData.length}] Error importing ${scrapedProduct.name}:`,
							error.message
						);
					}
				}
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('Import Summary');
		console.log('='.repeat(60));
		console.log(`✓ Successfully imported: ${totalImported} products`);
		console.log(`⊘ Skipped (duplicates): ${totalSkipped} products`);
		console.log(`✗ Errors: ${totalErrors} products`);
		console.log(`Total processed: ${totalImported + totalSkipped + totalErrors} products\n`);
	} finally {
		await pool.end();
	}

	process.exit(0);
}

importProducts().catch(async (error) => {
	console.error('Fatal error during import:', error);
	await pool.end();
	process.exit(1);
});
