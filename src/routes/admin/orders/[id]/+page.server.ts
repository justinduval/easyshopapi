import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getOrderById,
	updateOrderStatus,
	updatePaymentStatus,
	deleteOrder,
	validateStatusTransition
} from '$lib/server/api/orders';
import { sendEmail } from '$lib/server/email';
import { orderStatusUpdateTemplate } from '$lib/server/email/templates';

export const load: PageServerLoad = async ({ params }) => {
	const order = await getOrderById(params.id);

	if (!order) {
		throw error(404, 'Commande introuvable');
	}

	return { order };
};

export const actions = {
	updateStatus: async ({ request, params }) => {
		const formData = await request.formData();
		const newStatus = formData.get('order_status') as string;

		if (!newStatus) {
			return fail(400, { error: 'Statut requis' });
		}

		try {
			const updatedOrder = await updateOrderStatus(params.id, newStatus as any);

			if (!updatedOrder) {
				return fail(400, { error: 'Impossible de mettre à jour le statut' });
			}

			// Send status update email
			if (['confirmed', 'ready_for_pickup', 'completed', 'cancelled'].includes(newStatus)) {
				const order = await getOrderById(params.id);
				if (order) {
					const emailHtml = orderStatusUpdateTemplate(order, newStatus);
					await sendEmail({
						to: order.customer_email,
						subject: `Mise à jour de votre commande ${order.order_number}`,
						htmlContent: emailHtml
					});
				}
			}

			return { success: true, message: 'Statut mis à jour' };
		} catch (err: any) {
			return fail(400, { error: err.message || 'Erreur lors de la mise à jour' });
		}
	},

	updatePayment: async ({ request, params }) => {
		const formData = await request.formData();
		const newStatus = formData.get('payment_status') as string;

		if (!newStatus) {
			return fail(400, { error: 'Statut de paiement requis' });
		}

		try {
			const updatedOrder = await updatePaymentStatus(params.id, newStatus as any);

			if (!updatedOrder) {
				return fail(400, { error: 'Impossible de mettre à jour le statut de paiement' });
			}

			return { success: true, message: 'Statut de paiement mis à jour' };
		} catch (err: any) {
			return fail(400, { error: err.message || 'Erreur lors de la mise à jour' });
		}
	},

	delete: async ({ params }) => {
		try {
			await deleteOrder(params.id);
		} catch (err: any) {
			return fail(400, { error: err.message || 'Erreur lors de la suppression' });
		}

		redirect(303, '/admin/orders');
	}
} satisfies Actions;
