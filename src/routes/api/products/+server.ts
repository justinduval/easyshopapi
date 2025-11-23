import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllProducts } from '$lib/server/api/products';
import { secureApiEndpoint } from '$lib/server/api/security';

export const GET: RequestHandler = async (event) => {
	const corsHeaders = secureApiEndpoint(event);

	const url = new URL(event.request.url);
	const categorySlug = url.searchParams.get('category');
	const status = url.searchParams.get('status') || 'published';
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = parseInt(url.searchParams.get('limit') || '20', 10);

	try {
		// Get all products with filters
		const allProducts = await getAllProducts({
			status: status as 'published' | 'draft',
			stock_status: undefined,
			search: undefined
		});

		// Filter by category slug if provided
		let filteredProducts = allProducts;
		if (categorySlug) {
			// We need to join with categories to filter by slug
			// For now, we'll do it in memory (could be optimized with a DB query)
			filteredProducts = allProducts.filter(
				(p) => p.category_name?.toLowerCase().replace(/\s+/g, '-') === categorySlug
			);
		}

		// Pagination
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

		// Format response
		const response = {
			data: paginatedProducts.map((p) => ({
				id: p.id,
				reference: p.reference,
				name: p.name,
				slug: p.slug,
				description: p.description,
				price_ht: p.price,
				tva_rate: p.tva_rate,
				price_ttc: p.price * (1 + p.tva_rate / 100),
				stock_quantity: p.stock_quantity,
				stock_status: p.stock_status,
				images: p.images,
				category: {
					id: p.category_id,
					name: p.category_name
				}
			})),
			pagination: {
				page,
				limit,
				total: filteredProducts.length,
				totalPages: Math.ceil(filteredProducts.length / limit)
			}
		};

		return json(response, {
			headers: corsHeaders
		});
	} catch (error: any) {
		console.error('API products error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
