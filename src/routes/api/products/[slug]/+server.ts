import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductBySlug } from '$lib/server/api/products';
import { secureApiEndpoint } from '$lib/server/api/security';
import { query } from '$lib/server/db';

interface Review {
	id: string;
	customer_name: string;
	rating: number;
	comment: string;
	vendor_response: string | null;
	vendor_response_date: Date | null;
	created_at: Date;
}

export const GET: RequestHandler = async (event) => {
	const corsHeaders = secureApiEndpoint(event);

	try {
		const product = await getProductBySlug(event.params.slug);

		if (!product || product.status !== 'published') {
			throw error(404, 'Product not found');
		}

		// Get approved reviews for this product
		const reviewsResult = await query<Review>(
			`SELECT id, customer_name, rating, comment, vendor_response, vendor_response_date, created_at
			 FROM reviews
			 WHERE product_id = $1 AND status = 'approved'
			 ORDER BY created_at DESC`,
			[product.id]
		);

		const response = {
			id: product.id,
			reference: product.reference,
			name: product.name,
			slug: product.slug,
			description: product.description,
			price_ht: product.price,
			tva_rate: product.tva_rate,
			price_ttc: product.price * (1 + product.tva_rate / 100),
			stock_quantity: product.stock_quantity,
			stock_status: product.stock_status,
			images: product.images,
			meta_description: product.meta_description,
			category: {
				id: product.category_id,
				name: product.category_name
			},
			reviews: reviewsResult.rows.map((r) => ({
				id: r.id,
				customer_name: r.customer_name,
				rating: r.rating,
				comment: r.comment,
				vendor_response: r.vendor_response,
				vendor_response_date: r.vendor_response_date,
				created_at: r.created_at
			})),
			average_rating:
				reviewsResult.rows.length > 0
					? reviewsResult.rows.reduce((sum, r) => sum + r.rating, 0) / reviewsResult.rows.length
					: null,
			reviews_count: reviewsResult.rows.length
		};

		return json(response, {
			headers: corsHeaders
		});
	} catch (err: any) {
		if (err.status === 404) {
			return json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
		}

		console.error('API product detail error:', err);
		return json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
	}
};
