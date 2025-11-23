import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getAllReviews,
	updateReviewStatus,
	updateVendorResponse,
	deleteReview,
	reviewStatusSchema,
	vendorResponseSchema,
	type ReviewFilters
} from '$lib/server/api/reviews';
import { getAllProducts } from '$lib/server/api/products';

export const load: PageServerLoad = async ({ url }) => {
	// Extract filters from URL params
	const status = url.searchParams.get('status');
	const rating = url.searchParams.get('rating');
	const productId = url.searchParams.get('product_id');
	const search = url.searchParams.get('search');
	const page = parseInt(url.searchParams.get('page') || '1');

	// Build filters object
	const filters: ReviewFilters = {};

	if (status && status !== 'all') {
		filters.status = status as any;
	}

	if (rating && rating !== 'all') {
		filters.rating = parseInt(rating);
	}

	if (productId && productId !== 'all') {
		filters.product_id = productId;
	}

	if (search && search.trim()) {
		filters.search = search.trim();
	}

	// Fetch reviews with pagination
	const [reviewsResult, products] = await Promise.all([
		getAllReviews(filters, { page, limit: 50 }),
		getAllProducts()
	]);

	return {
		reviews: reviewsResult.data,
		pagination: reviewsResult.pagination,
		products,
		filters: {
			status: status || 'all',
			rating: rating || 'all',
			product_id: productId || 'all',
			search: search || ''
		}
	};
};

export const actions = {
	approve: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, {
				error: 'ID requis'
			});
		}

		try {
			await updateReviewStatus(id, 'approved');
			return { success: true };
		} catch (error: any) {
			console.error('Approve review error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de l\'approbation'
			});
		}
	},

	reject: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, {
				error: 'ID requis'
			});
		}

		try {
			await updateReviewStatus(id, 'rejected');
			return { success: true };
		} catch (error: any) {
			console.error('Reject review error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors du rejet'
			});
		}
	},

	respond: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const vendor_response = formData.get('vendor_response') as string;

		if (!id) {
			return fail(400, {
				error: 'ID requis'
			});
		}

		// Validate response
		const validation = vendorResponseSchema.safeParse({ vendor_response });

		if (!validation.success) {
			return fail(400, {
				error: validation.error.errors[0].message
			});
		}

		try {
			await updateVendorResponse(id, validation.data.vendor_response);
			return { success: true };
		} catch (error: any) {
			console.error('Respond to review error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de l\'ajout de la réponse'
			});
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, {
				error: 'ID requis'
			});
		}

		try {
			await deleteReview(id);
			return { success: true };
		} catch (error: any) {
			console.error('Delete review error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la suppression'
			});
		}
	}
} satisfies Actions;
