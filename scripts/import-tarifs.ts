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

interface TarifItem {
	reference: string;
	name: string;
	price: number;
	stock?: number;
	category?: string;
}

interface ImportStats {
	created: number;
	updated: number;
	skipped: number;
	errors: number;
}

// Parse the pneus-batteries.txt file
function parsePneusBatteriesTxt(filePath: string): TarifItem[] {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');
	const items: TarifItem[] = [];

	// Skip header line
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const parts = line.split('\t');
		if (parts.length < 4) continue;

		const reference = parts[0].trim();
		const name = parts[1].trim();
		const stockStr = parts[2].trim();
		const priceStr = parts[3].trim();

		// Skip rupture items or parse stock
		let stock = 0;
		if (stockStr.toLowerCase() === 'rupture' || priceStr.toLowerCase().includes('rupture')) {
			stock = 0;
		} else {
			stock = parseInt(stockStr, 10) || 0;
		}

		// Parse price (handle "RUPTURE" case)
		let price = 0;
		if (!priceStr.toLowerCase().includes('rupture')) {
			price = parseFloat(priceStr.replace(',', '.')) || 0;
		}

		// Determine category from name
		let category = 'pneus';
		if (name.toLowerCase().includes('bat ') || name.toLowerCase().startsWith('bat')) {
			category = 'batteries';
		}

		if (reference && name) {
			items.push({
				reference,
				name,
				price,
				stock,
				category
			});
		}
	}

	return items;
}

// Parse the extracted huiles JSON
function parseHuilesJson(filePath: string): TarifItem[] {
	const content = fs.readFileSync(filePath, 'utf-8');
	const data = JSON.parse(content);

	return data.map((item: any) => ({
		reference: item.reference,
		name: item.name,
		price: item.price,
		stock: item.stock || 0,
		category: 'lubrifiants'
	}));
}

// Create slug from name
function createSlug(name: string, reference: string): string {
	const baseSlug = name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remove accents
		.replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
		.replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
		.substring(0, 200); // Limit length

	return `${baseSlug}-${reference.toLowerCase()}`;
}

// Get or create category
async function ensureCategory(
	slug: string,
	name: string,
	description: string
): Promise<string> {
	const existing = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);

	if (existing.rows.length > 0) {
		return existing.rows[0].id;
	}

	const result = await pool.query(
		`INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING id`,
		[name, slug, description]
	);

	console.log(`Created category: ${name}`);
	return result.rows[0].id;
}

// Upsert product
async function upsertProduct(
	item: TarifItem,
	categoryId: string,
	imageUrl: string | null
): Promise<'created' | 'updated' | 'skipped'> {
	const slug = createSlug(item.name, item.reference);

	// Check if product exists
	const existing = await pool.query('SELECT id, price, stock_quantity FROM products WHERE reference = $1', [
		item.reference
	]);

	if (existing.rows.length > 0) {
		// Update existing product
		const currentPrice = parseFloat(existing.rows[0].price);
		const currentStock = existing.rows[0].stock_quantity;

		// Only update if price or stock changed
		if (currentPrice !== item.price || currentStock !== item.stock) {
			const updates: string[] = [];
			const values: any[] = [];
			let paramIndex = 1;

			if (currentPrice !== item.price) {
				updates.push(`price = $${paramIndex++}`);
				values.push(item.price);
			}

			if (currentStock !== item.stock) {
				updates.push(`stock_quantity = $${paramIndex++}`);
				values.push(item.stock || 0);
			}

			if (imageUrl) {
				updates.push(`images = $${paramIndex++}`);
				values.push([imageUrl]);
			}

			values.push(item.reference);

			await pool.query(
				`UPDATE products SET ${updates.join(', ')} WHERE reference = $${paramIndex}`,
				values
			);

			return 'updated';
		}

		return 'skipped';
	}

	// Create new product
	const images = imageUrl ? [imageUrl] : [];

	await pool.query(
		`INSERT INTO products
		 (category_id, reference, name, slug, description, price, tva_rate, stock_quantity, images, meta_description, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		[
			categoryId,
			item.reference,
			item.name,
			slug,
			item.name, // Use name as description
			item.price,
			20, // TVA rate
			item.stock || 0,
			images,
			item.name.substring(0, 255),
			'published'
		]
	);

	return 'created';
}

async function main() {
	console.log('='.repeat(60));
	console.log('Tarifs Import Script');
	console.log('='.repeat(60));

	const stats: ImportStats = {
		created: 0,
		updated: 0,
		skipped: 0,
		errors: 0
	};

	try {
		// Ensure categories exist
		const categoryIds: Record<string, string> = {
			pneus: await ensureCategory('pneus', 'Pneus', 'Pneus moto, cross, route'),
			batteries: await ensureCategory('batteries', 'Batteries', 'Batteries moto Landport'),
			lubrifiants: await ensureCategory('lubrifiants', 'Lubrifiants', 'Huiles et lubrifiants Motorex')
		};

		// Load image mapping if exists (generated by process-images.ts)
		const mappingPath = path.join(__dirname, '..', 'reference-mapping.json');
		let imageMapping: Record<string, string> = {};
		if (fs.existsSync(mappingPath)) {
			imageMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
			console.log(`Loaded ${Object.keys(imageMapping).length} image mappings (R2 URLs)`);
		} else {
			console.log('No image mapping found. Run process-images.ts first to upload images.');
		}

		// Parse tarifs files
		const allItems: TarifItem[] = [];

		// 1. Parse pneus-batteries.txt
		const pneusBatteriesPath = path.join(__dirname, '..', 'a_integrer', 'tarifs', 'pneus-batteries.txt');
		if (fs.existsSync(pneusBatteriesPath)) {
			const items = parsePneusBatteriesTxt(pneusBatteriesPath);
			console.log(`Loaded ${items.length} items from pneus-batteries.txt`);
			allItems.push(...items);
		}

		// 2. Parse huiles-extracted.json
		const huilesPath = path.join(__dirname, '..', 'a_integrer', 'tarifs', 'huiles-extracted.json');
		if (fs.existsSync(huilesPath)) {
			const items = parseHuilesJson(huilesPath);
			console.log(`Loaded ${items.length} items from huiles-extracted.json`);
			allItems.push(...items);
		}

		console.log(`\nTotal items to process: ${allItems.length}\n`);

		// Process items
		for (let i = 0; i < allItems.length; i++) {
			const item = allItems[i];
			const categoryId = categoryIds[item.category || 'pneus'];
			const imageUrl = imageMapping[item.reference] || null;

			try {
				const result = await upsertProduct(item, categoryId, imageUrl);

				switch (result) {
					case 'created':
						stats.created++;
						console.log(`✓ [${i + 1}/${allItems.length}] Created: ${item.reference} - ${item.name.substring(0, 40)}...`);
						break;
					case 'updated':
						stats.updated++;
						console.log(`↻ [${i + 1}/${allItems.length}] Updated: ${item.reference}`);
						break;
					case 'skipped':
						stats.skipped++;
						break;
				}
			} catch (error: any) {
				stats.errors++;
				if (error?.code === '23505') {
					// Duplicate key - likely slug conflict, try with different slug
					console.log(`⊘ [${i + 1}/${allItems.length}] Duplicate: ${item.reference}`);
				} else {
					console.error(`✗ [${i + 1}/${allItems.length}] Error: ${item.reference} - ${error.message}`);
				}
			}
		}

		// Summary
		console.log('\n' + '='.repeat(60));
		console.log('Import Summary');
		console.log('='.repeat(60));
		console.log(`✓ Created: ${stats.created} products`);
		console.log(`↻ Updated: ${stats.updated} products`);
		console.log(`⊘ Skipped: ${stats.skipped} products (no changes)`);
		console.log(`✗ Errors: ${stats.errors} products`);
		console.log(`Total processed: ${allItems.length} products`);
	} finally {
		await pool.end();
	}
}

main().catch(async (error) => {
	console.error('Fatal error:', error);
	await pool.end();
	process.exit(1);
});
