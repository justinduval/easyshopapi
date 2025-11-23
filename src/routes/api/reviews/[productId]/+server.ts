import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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

	const url = new URL(event.request.url);
	const status = url.searchParams.get('status') || 'approved';

	try {
		const reviewsResult = await query<Review>(
			`SELECT id, customer_name, rating, comment, vendor_response, vendor_response_date, created_at
			 FROM reviews
			 WHERE product_id = $1 AND status = $2
			 ORDER BY created_at DESC`,
			[event.params.productId, status]
		);

		const response = {
			data: reviewsResult.rows.map((r) => ({
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
			count: reviewsResult.rows.length
		};

		return json(response, {
			headers: corsHeaders
		});
	} catch (error: any) {
		console.error('API reviews error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
