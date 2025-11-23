import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllCategories } from '$lib/server/api/categories';
import { secureApiEndpoint } from '$lib/server/api/security';
import { query } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	const corsHeaders = secureApiEndpoint(event);

	try {
		const categories = await getAllCategories();

		// Get published products count for each category
		const categoriesWithCount = await Promise.all(
			categories.map(async (cat) => {
				const result = await query<{ count: number }>(
					`SELECT COUNT(*)::int as count
					 FROM products
					 WHERE category_id = $1 AND status = 'published'`,
					[cat.id]
				);

				return {
					id: cat.id,
					name: cat.name,
					slug: cat.slug,
					description: cat.description,
					products_count: result.rows[0].count
				};
			})
		);

		return json(
			{
				data: categoriesWithCount
			},
			{
				headers: corsHeaders
			}
		);
	} catch (error: any) {
		console.error('API categories error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
