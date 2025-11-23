import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { secureApiEndpoint } from '$lib/server/api/security';
import { query } from '$lib/server/db';
import { z } from 'zod';

const reviewSchema = z.object({
	productId: z.string().uuid(),
	customerName: z.string().min(1).max(255),
	customerEmail: z.string().email(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().min(1),
	orderId: z.string().uuid().optional()
});

export const POST: RequestHandler = async (event) => {
	const corsHeaders = secureApiEndpoint(event);

	try {
		const body = await event.request.json();

		// Validate input
		const validation = reviewSchema.safeParse(body);

		if (!validation.success) {
			return json(
				{ error: 'Invalid input', details: validation.error.errors },
				{ status: 400, headers: corsHeaders }
			);
		}

		const data = validation.data;

		// Check if product exists
		const productResult = await query(
			'SELECT id FROM products WHERE id = $1 AND status = $2',
			[data.productId, 'published']
		);

		if (productResult.rows.length === 0) {
			return json(
				{ error: 'Product not found' },
				{ status: 404, headers: corsHeaders }
			);
		}

		// Check if order exists (if provided)
		if (data.orderId) {
			const orderResult = await query(
				'SELECT id FROM orders WHERE id = $1',
				[data.orderId]
			);

			if (orderResult.rows.length === 0) {
				return json(
					{ error: 'Order not found' },
					{ status: 404, headers: corsHeaders }
				);
			}
		}

		// Create review with pending status
		const result = await query<{ id: string }>(
			`INSERT INTO reviews
			 (product_id, order_id, customer_name, customer_email, rating, comment, status)
			 VALUES ($1, $2, $3, $4, $5, $6, 'pending')
			 RETURNING id`,
			[
				data.productId,
				data.orderId || null,
				data.customerName,
				data.customerEmail,
				data.rating,
				data.comment
			]
		);

		return json(
			{
				success: true,
				message: 'Review submitted successfully. It will be published after moderation.',
				review_id: result.rows[0].id
			},
			{
				status: 201,
				headers: corsHeaders
			}
		);
	} catch (err: any) {
		console.error('API create review error:', err);
		return json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
