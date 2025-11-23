import { query } from '../db';
import { z } from 'zod';
import { generateSlug } from '$lib/utils/slug';

export interface Category {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	created_at: Date;
	updated_at: Date;
	product_count?: number;
}

export const categorySchema = z.object({
	name: z.string().min(1, 'Le nom est requis').max(255),
	slug: z.string().min(1, 'Le slug est requis').max(255).regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
	description: z.string().optional().nullable()
});

export type CategoryInput = z.infer<typeof categorySchema>;

// Re-export generateSlug for backward compatibility
export { generateSlug };

/**
 * Get all categories with product count
 */
export async function getAllCategories(): Promise<Category[]> {
	const result = await query<Category>(
		`SELECT c.*, COUNT(p.id)::int as product_count
		 FROM categories c
		 LEFT JOIN products p ON c.id = p.category_id
		 GROUP BY c.id
		 ORDER BY c.name ASC`
	);

	return result.rows;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
	const result = await query<Category>(
		`SELECT c.*, COUNT(p.id)::int as product_count
		 FROM categories c
		 LEFT JOIN products p ON c.id = p.category_id
		 WHERE c.id = $1
		 GROUP BY c.id`,
		[id]
	);

	return result.rows[0] || null;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
	const result = await query<Category>(
		'SELECT * FROM categories WHERE slug = $1',
		[slug]
	);

	return result.rows[0] || null;
}

/**
 * Create a new category
 */
export async function createCategory(data: CategoryInput): Promise<Category> {
	const result = await query<Category>(
		`INSERT INTO categories (name, slug, description)
		 VALUES ($1, $2, $3)
		 RETURNING *`,
		[data.name, data.slug, data.description || null]
	);

	return result.rows[0];
}

/**
 * Update a category
 */
export async function updateCategory(id: string, data: CategoryInput): Promise<Category | null> {
	const result = await query<Category>(
		`UPDATE categories
		 SET name = $1, slug = $2, description = $3
		 WHERE id = $4
		 RETURNING *`,
		[data.name, data.slug, data.description || null, id]
	);

	return result.rows[0] || null;
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<boolean> {
	// Check if category has products
	const checkResult = await query<{ count: number }>(
		'SELECT COUNT(*)::int as count FROM products WHERE category_id = $1',
		[id]
	);

	if (checkResult.rows[0].count > 0) {
		throw new Error('Impossible de supprimer une catégorie contenant des produits');
	}

	const result = await query(
		'DELETE FROM categories WHERE id = $1',
		[id]
	);

	return (result.rowCount ?? 0) > 0;
}
