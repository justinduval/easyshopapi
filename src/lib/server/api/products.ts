import { query } from '../db';
import { z } from 'zod';
import { generateProductSlug } from '$lib/utils/slug';

export interface Product {
	id: string;
	category_id: string;
	category_name?: string;
	category_slug?: string;
	reference: string;
	name: string;
	slug: string;
	description: string;
	price: number;
	tva_rate: number;
	stock_quantity: number;
	stock_status: 'available' | 'out_of_stock';
	images: string[];
	meta_description: string | null;
	status: 'draft' | 'published';
	created_at: Date;
	updated_at: Date;
}

export const productSchema = z.object({
	category_id: z.string().uuid('Catégorie invalide'),
	reference: z.string().min(1, 'Référence requise').max(255),
	name: z.string().min(1, 'Nom requis').max(255),
	slug: z
		.string()
		.min(1, 'Slug requis')
		.max(255)
		.regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
	description: z.string().min(1, 'Description requise'),
	price: z.number().min(0, 'Prix invalide'),
	tva_rate: z.number().min(0).max(100, 'Taux TVA invalide'),
	stock_quantity: z.number().int().min(0, 'Quantité invalide'),
	images: z.array(z.string()).default([]),
	meta_description: z.string().max(255).optional().nullable(),
	status: z.enum(['draft', 'published'])
});

export type ProductInput = z.infer<typeof productSchema>;

export interface ProductFilters {
	category_id?: string;
	status?: 'draft' | 'published';
	stock_status?: 'available' | 'out_of_stock';
	search?: string;
}

// Re-export generateProductSlug for backward compatibility
export { generateProductSlug };

/**
 * Get all products with optional filters
 */
export async function getAllProducts(filters?: ProductFilters): Promise<Product[]> {
	let queryText = `
		SELECT p.*, c.name as category_name, c.slug as category_slug
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE 1=1
	`;
	const params: any[] = [];
	let paramIndex = 1;

	if (filters?.category_id) {
		queryText += ` AND p.category_id = $${paramIndex}`;
		params.push(filters.category_id);
		paramIndex++;
	}

	if (filters?.status) {
		queryText += ` AND p.status = $${paramIndex}`;
		params.push(filters.status);
		paramIndex++;
	}

	if (filters?.stock_status) {
		queryText += ` AND p.stock_status = $${paramIndex}`;
		params.push(filters.stock_status);
		paramIndex++;
	}

	if (filters?.search) {
		queryText += ` AND (p.name ILIKE $${paramIndex} OR p.reference ILIKE $${paramIndex})`;
		params.push(`%${filters.search}%`);
		paramIndex++;
	}

	queryText += ` ORDER BY p.created_at DESC`;

	const result = await query<Product>(queryText, params);
	return result.rows;
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
	const result = await query<Product>(
		`SELECT p.*, c.name as category_name, c.slug as category_slug
		 FROM products p
		 LEFT JOIN categories c ON p.category_id = c.id
		 WHERE p.id = $1`,
		[id]
	);

	return result.rows[0] || null;
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
	const result = await query<Product>(
		`SELECT p.*, c.name as category_name, c.slug as category_slug
		 FROM products p
		 LEFT JOIN categories c ON p.category_id = c.id
		 WHERE p.slug = $1`,
		[slug]
	);

	return result.rows[0] || null;
}

/**
 * Create a new product
 */
export async function createProduct(data: ProductInput): Promise<Product> {
	const result = await query<Product>(
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
			data.meta_description || null,
			data.status
		]
	);

	return result.rows[0];
}

/**
 * Update a product
 */
export async function updateProduct(id: string, data: ProductInput): Promise<Product | null> {
	const result = await query<Product>(
		`UPDATE products
		 SET category_id = $1,
		     reference = $2,
		     name = $3,
		     slug = $4,
		     description = $5,
		     price = $6,
		     tva_rate = $7,
		     stock_quantity = $8,
		     images = $9,
		     meta_description = $10,
		     status = $11
		 WHERE id = $12
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
			data.meta_description || null,
			data.status,
			id
		]
	);

	return result.rows[0] || null;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<boolean> {
	// Check if product is in orders
	const checkResult = await query<{ count: number }>(
		'SELECT COUNT(*)::int as count FROM order_items WHERE product_id = $1',
		[id]
	);

	if (checkResult.rows[0].count > 0) {
		throw new Error('Impossible de supprimer un produit présent dans des commandes');
	}

	const result = await query('DELETE FROM products WHERE id = $1', [id]);

	return (result.rowCount ?? 0) > 0;
}

/**
 * Get products count by status
 */
export async function getProductsStats(): Promise<{
	total: number;
	published: number;
	draft: number;
	out_of_stock: number;
}> {
	const result = await query<{
		total: number;
		published: number;
		draft: number;
		out_of_stock: number;
	}>(
		`SELECT
			COUNT(*)::int as total,
			COUNT(CASE WHEN status = 'published' THEN 1 END)::int as published,
			COUNT(CASE WHEN status = 'draft' THEN 1 END)::int as draft,
			COUNT(CASE WHEN stock_status = 'out_of_stock' THEN 1 END)::int as out_of_stock
		 FROM products`
	);

	return result.rows[0] || { total: 0, published: 0, draft: 0, out_of_stock: 0 };
}
