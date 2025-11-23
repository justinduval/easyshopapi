import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getAllOrders,
	updateOrderStatus,
	updatePaymentStatus,
	deleteOrder,
	orderStatusSchema,
	paymentStatusSchema,
	type OrderFilters
} from '$lib/server/api/orders';

export const load: PageServerLoad = async ({ url }) => {
	// Extract filters from URL params
	const orderStatus = url.searchParams.get('order_status');
	const paymentStatus = url.searchParams.get('payment_status');
	const paymentMethod = url.searchParams.get('payment_method');
	const search = url.searchParams.get('search');
	const dateFrom = url.searchParams.get('date_from');
	const dateTo = url.searchParams.get('date_to');
	const page = parseInt(url.searchParams.get('page') || '1');

	// Build filters object
	const filters: OrderFilters = {};

	if (orderStatus && orderStatus !== 'all') {
		filters.order_status = orderStatus as any;
	}

	if (paymentStatus && paymentStatus !== 'all') {
		filters.payment_status = paymentStatus as any;
	}

	if (paymentMethod && paymentMethod !== 'all') {
		filters.payment_method = paymentMethod as any;
	}

	if (search && search.trim()) {
		filters.search = search.trim();
	}

	if (dateFrom) {
		filters.date_from = dateFrom;
	}

	if (dateTo) {
		filters.date_to = dateTo;
	}

	// Fetch orders with pagination
	const result = await getAllOrders(filters, { page, limit: 50 });

	return {
		orders: result.data,
		pagination: result.pagination,
		filters: {
			order_status: orderStatus || 'all',
			payment_status: paymentStatus || 'all',
			payment_method: paymentMethod || 'all',
			search: search || '',
			date_from: dateFrom || '',
			date_to: dateTo || ''
		}
	};
};

export const actions = {
	updateStatus: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const order_status = formData.get('order_status') as string;

		if (!id || !order_status) {
			return fail(400, {
				error: 'ID et statut requis'
			});
		}

		// Validate status
		const validation = orderStatusSchema.safeParse(order_status);

		if (!validation.success) {
			return fail(400, {
				error: 'Statut invalide'
			});
		}

		try {
			await updateOrderStatus(id, validation.data);
			return { success: true };
		} catch (error: any) {
			console.error('Update order status error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la mise à jour du statut'
			});
		}
	},

	updatePayment: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const payment_status = formData.get('payment_status') as string;

		if (!id || !payment_status) {
			return fail(400, {
				error: 'ID et statut de paiement requis'
			});
		}

		// Validate payment status
		const validation = paymentStatusSchema.safeParse(payment_status);

		if (!validation.success) {
			return fail(400, {
				error: 'Statut de paiement invalide'
			});
		}

		try {
			await updatePaymentStatus(id, validation.data);
			return { success: true };
		} catch (error: any) {
			console.error('Update payment status error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la mise à jour du paiement'
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
			await deleteOrder(id);
			return { success: true };
		} catch (error: any) {
			console.error('Delete order error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la suppression'
			});
		}
	}
} satisfies Actions;
