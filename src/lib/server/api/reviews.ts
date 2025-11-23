import { query } from '../db';
import { z } from 'zod';

export interface Review {
	id: string;
	product_id: string;
	order_id: string | null;
	customer_name: string;
	customer_email: string;
	rating: number;
	comment: string;
	status: 'pending' | 'approved' | 'rejected';
	vendor_response: string | null;
	vendor_response_date: Date | null;
	created_at: Date;
}

export interface ReviewWithProduct extends Review {
	product_name: string;
	product_slug: string;
	product_image: string | null;
}

export interface ReviewFilters {
	status?: Review['status'];
	rating?: number;
	product_id?: string;
	search?: string;
}

export interface PaginationParams {
	page?: number;
	limit?: number;
}

export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// Validation schemas
export const reviewStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const updateReviewStatusSchema = z.object({
	status: reviewStatusSchema
});

export const vendorResponseSchema = z.object({
	vendor_response: z.string().min(1, 'La réponse ne peut pas être vide').max(1000, 'La réponse est trop longue (max 1000 caractères)')
});

export type VendorResponseInput = z.infer<typeof vendorResponseSchema>;

/**
 * Get all reviews with optional filters and pagination
 */
export async function getAllReviews(
	filters?: ReviewFilters,
	paginationParams?: PaginationParams
): Promise<PaginatedResult<ReviewWithProduct>> {
	const page = paginationParams?.page || 1;
	const limit = paginationParams?.limit || 50;
	const offset = (page - 1) * limit;

	let whereClause = 'WHERE 1=1';
	const params: any[] = [];
	let paramIndex = 1;

	// Build WHERE clause
	if (filters?.status) {
		whereClause += ` AND r.status = $${paramIndex}`;
		params.push(filters.status);
		paramIndex++;
	}

	if (filters?.rating) {
		whereClause += ` AND r.rating = $${paramIndex}`;
		params.push(filters.rating);
		paramIndex++;
	}

	if (filters?.product_id) {
		whereClause += ` AND r.product_id = $${paramIndex}`;
		params.push(filters.product_id);
		paramIndex++;
	}

	if (filters?.search) {
		whereClause += ` AND (
			r.customer_name ILIKE $${paramIndex} OR
			r.customer_email ILIKE $${paramIndex} OR
			r.comment ILIKE $${paramIndex} OR
			p.name ILIKE $${paramIndex}
		)`;
		params.push(`%${filters.search}%`);
		paramIndex++;
	}

	// Get total count
	const countResult = await query<{ count: number }>(
		`SELECT COUNT(*)::int as count
		 FROM reviews r
		 LEFT JOIN products p ON r.product_id = p.id
		 ${whereClause}`,
		params
	);

	const total = countResult.rows[0]?.count || 0;
	const totalPages = Math.ceil(total / limit);

	// Get paginated data
	const dataQuery = `
		SELECT r.*,
		       p.name as product_name,
		       p.slug as product_slug,
		       p.images[1] as product_image
		FROM reviews r
		LEFT JOIN products p ON r.product_id = p.id
		${whereClause}
		ORDER BY r.created_at DESC
		LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
	`;

	const result = await query<ReviewWithProduct>(dataQuery, [...params, limit, offset]);

	return {
		data: result.rows,
		pagination: {
			page,
			limit,
			total,
			totalPages
		}
	};
}

/**
 * Get review by ID
 */
export async function getReviewById(id: string): Promise<ReviewWithProduct | null> {
	const result = await query<ReviewWithProduct>(
		`SELECT r.*,
		        p.name as product_name,
		        p.slug as product_slug,
		        p.images[1] as product_image
		 FROM reviews r
		 LEFT JOIN products p ON r.product_id = p.id
		 WHERE r.id = $1`,
		[id]
	);

	return result.rows[0] || null;
}

/**
 * Get reviews by product ID
 */
export async function getReviewsByProductId(productId: string, status?: Review['status']): Promise<Review[]> {
	let query_text = 'SELECT * FROM reviews WHERE product_id = $1';
	const params: any[] = [productId];

	if (status) {
		query_text += ' AND status = $2';
		params.push(status);
	}

	query_text += ' ORDER BY created_at DESC';

	const result = await query<Review>(query_text, params);
	return result.rows;
}

/**
 * Update review status (approve/reject)
 */
export async function updateReviewStatus(
	id: string,
	newStatus: Review['status']
): Promise<Review | null> {
	const result = await query<Review>(
		`UPDATE reviews
		 SET status = $1
		 WHERE id = $2
		 RETURNING *`,
		[newStatus, id]
	);

	return result.rows[0] || null;
}

/**
 * Add or update vendor response
 */
export async function updateVendorResponse(
	id: string,
	response: string
): Promise<Review | null> {
	const result = await query<Review>(
		`UPDATE reviews
		 SET vendor_response = $1,
		     vendor_response_date = CURRENT_TIMESTAMP
		 WHERE id = $2
		 RETURNING *`,
		[response, id]
	);

	return result.rows[0] || null;
}

/**
 * Delete vendor response
 */
export async function deleteVendorResponse(id: string): Promise<Review | null> {
	const result = await query<Review>(
		`UPDATE reviews
		 SET vendor_response = NULL,
		     vendor_response_date = NULL
		 WHERE id = $2
		 RETURNING *`,
		[id]
	);

	return result.rows[0] || null;
}

/**
 * Delete a review
 */
export async function deleteReview(id: string): Promise<boolean> {
	const result = await query('DELETE FROM reviews WHERE id = $1', [id]);
	return (result.rowCount ?? 0) > 0;
}

/**
 * Get review statistics
 */
export async function getReviewStats() {
	const result = await query<{
		total_reviews: number;
		pending_reviews: number;
		approved_reviews: number;
		rejected_reviews: number;
		average_rating: number;
	}>(`
		SELECT
			COUNT(*)::int as total_reviews,
			COUNT(*) FILTER (WHERE status = 'pending')::int as pending_reviews,
			COUNT(*) FILTER (WHERE status = 'approved')::int as approved_reviews,
			COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected_reviews,
			COALESCE(AVG(rating) FILTER (WHERE status = 'approved'), 0) as average_rating
		FROM reviews
	`);

	return result.rows[0];
}

/**
 * Get product rating average
 */
export async function getProductRating(productId: string): Promise<{ average: number; count: number }> {
	const result = await query<{ average: number; count: number }>(`
		SELECT
			COALESCE(AVG(rating), 0) as average,
			COUNT(*)::int as count
		FROM reviews
		WHERE product_id = $1 AND status = 'approved'
	`, [productId]);

	return result.rows[0] || { average: 0, count: 0 };
}
